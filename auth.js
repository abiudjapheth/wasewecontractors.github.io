import { auth } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';

async function registerUser(email, password) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(result.user);
  return result.user;
}

async function loginUser(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

async function logoutUser() {
  await signOut(auth);
}

function onAuthStateChangedHandler(callback) {
  return onAuthStateChanged(auth, callback);
}

export { registerUser, loginUser, logoutUser, onAuthStateChangedHandler };