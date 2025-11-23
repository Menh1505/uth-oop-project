import admin from 'firebase-admin';

let initialized = false;

function getFirebaseApp() {
  if (!initialized) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase service account configuration');
    }

    const normalizedKey = privateKey.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: normalizedKey,
      }),
    });

    initialized = true;
  }

  return admin;
}

export async function verifyFirebaseIdToken(idToken: string) {
  const app = getFirebaseApp();
  return app.auth().verifyIdToken(idToken);
}
