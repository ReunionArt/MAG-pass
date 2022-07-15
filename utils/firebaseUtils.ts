import { initializeApp } from 'firebase/app'
import {
    getDoc,
    doc,
    setDoc,
    addDoc,
    collection,
    getFirestore,
    arrayUnion,
    arrayRemove,
    updateDoc,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
}
//

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

const appCheck = initializeAppCheck(app!, {
    provider: new ReCaptchaV3Provider(
        '6LdebfAgAAAAALGeUOCjC8k6TjPnzlIcz1KuJQ6B'
    ),
    isTokenAutoRefreshEnabled: true,
})

export {
    app,
    getDoc,
    doc,
    setDoc,
    addDoc,
    collection,
    db,
    arrayUnion,
    arrayRemove,
    updateDoc,
    auth,
}
