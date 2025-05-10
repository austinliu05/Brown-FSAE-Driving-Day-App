import {  GoogleAuthProvider, User, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../api/firebaseConfig';

export const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // console.log('Login successful', result.user.email);
    if(result.user){
    // setCurrUserId(result.user.email);
        console.log("Login successful")
        return result.user.email;
    }
    return null;
};

export const handleGoogleLogout = async () => {
    await auth.signOut();
    console.log("Logout successful")
};
