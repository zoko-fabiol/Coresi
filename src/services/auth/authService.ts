import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { AppUser, UserStatus } from '../../types/auth';
import { UserRole } from '../../types';

function removeUndefined<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      result[k] = v;
    }
  }
  return result;
}

export class AuthService {
  private static cachedUser: AppUser | null = null;
  private static listeners: ((user: AppUser | null) => void)[] = [];

  public static subscribe(callback: (user: AppUser | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.cachedUser);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private static notify(user: AppUser | null) {
    this.cachedUser = user;
    this.listeners.forEach((cb) => cb(user));
  }

  public static getCurrentUser(): AppUser | null {
    return this.cachedUser;
  }

  public static async init(): Promise<void> {
    onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        this.notify(null);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userDocRef);

        if (snap.exists()) {
          const data = snap.data() as AppUser;
          // Check if user is active
          if (data.status === 'desactive' || data.status === 'suspendu' || data.isActive === false) {
            console.warn('Utilisateur suspendu ou désactivé.');
            await fbSignOut(auth);
            this.notify(null);
            throw new Error('Votre compte est suspendu ou désactivé. Veuillez contacter la Direction.');
          }

          // Update lastLoginAt
          await updateDoc(userDocRef, {
            lastLoginAt: new Date().toISOString(),
          }).catch(() => {});

          const updatedUser: AppUser = {
            ...data,
            lastLoginAt: new Date().toISOString(),
          };
          this.notify(updatedUser);
        } else {
          // Auto-provision initial user or admin
          const isPrimaryAdmin = fbUser.email === 'clausephwandji2020@gmail.com';
          const newUser: AppUser = removeUndefined({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || (isPrimaryAdmin ? 'Dr. Joseph Ndoundo (DG)' : 'Utilisateur CORESI'),
            photoURL: fbUser.photoURL || '',
            role: isPrimaryAdmin ? 'dg' : 'employe',
            status: 'actif',
            isActive: true,
            department: isPrimaryAdmin ? 'direction' : 'operations',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          });

          await setDoc(userDocRef, newUser);
          this.notify(newUser);
        }
      } catch (err) {
        console.error('Erreur chargement profil utilisateur:', err);
        this.notify(null);
      }
    });
  }

  public static async loginEmail(email: string, pass: string): Promise<AppUser> {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (snap.exists()) {
      const user = snap.data() as AppUser;
      if (user.status === 'desactive' || user.status === 'suspendu' || !user.isActive) {
        await fbSignOut(auth);
        throw new Error('Votre compte a été suspendu ou désactivé par un administrateur.');
      }
      this.notify(user);
      return user;
    }
    throw new Error('Profil utilisateur introuvable.');
  }

  public static async loginGoogle(): Promise<AppUser | null> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const userDocRef = doc(db, 'users', cred.user.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const user = snap.data() as AppUser;
      if (user.status === 'desactive' || user.status === 'suspendu' || !user.isActive) {
        await fbSignOut(auth);
        throw new Error('Compte suspendu ou désactivé.');
      }
      this.notify(user);
      return user;
    }

    const isPrimaryAdmin = cred.user.email === 'clausephwandji2020@gmail.com';
    const newUser: AppUser = removeUndefined({
      uid: cred.user.uid,
      email: cred.user.email || '',
      displayName: cred.user.displayName || (isPrimaryAdmin ? 'Dr. Joseph Ndoundo (DG)' : 'Collaborateur CORESI'),
      photoURL: cred.user.photoURL || '',
      role: isPrimaryAdmin ? 'dg' : 'employe',
      status: 'actif',
      isActive: true,
      department: isPrimaryAdmin ? 'direction' : 'operations',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    });

    await setDoc(userDocRef, newUser);
    this.notify(newUser);
    return newUser;
  }

  public static async registerUser(
    email: string,
    pass: string,
    displayName: string,
    role: UserRole = 'employe',
    department: string = 'operations',
    phone?: string
  ): Promise<AppUser> {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName });

    const newUser: AppUser = removeUndefined({
      uid: cred.user.uid,
      email,
      displayName,
      role,
      status: 'actif',
      isActive: true,
      department,
      phone: phone || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      createdBy: this.cachedUser?.uid || 'admin',
    });

    await setDoc(doc(db, 'users', cred.user.uid), newUser);
    this.notify(newUser);
    return newUser;
  }

  public static async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  public static async changePassword(newPassword: string): Promise<void> {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPassword);
    } else {
      throw new Error('Aucun utilisateur connecté.');
    }
  }

  public static async logout(): Promise<void> {
    await fbSignOut(auth);
    this.notify(null);
  }

  public static async getAllUsers(): Promise<AppUser[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map((d) => d.data() as AppUser);
    } catch {
      return [];
    }
  }

  public static async updateUserStatus(uid: string, status: UserStatus, isActive: boolean): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
      status,
      isActive,
      updatedAt: new Date().toISOString(),
    });
  }

  public static async updateUserRole(uid: string, role: UserRole, department?: string): Promise<void> {
    const data: Partial<AppUser> = {
      role,
      updatedAt: new Date().toISOString(),
    };
    if (department) data.department = department;
    await updateDoc(doc(db, 'users', uid), data);
  }
}
