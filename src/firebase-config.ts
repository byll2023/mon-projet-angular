import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { environment } from './environments/environment';

export const app = initializeApp(environment.firebaseConfig);
export const analytics = getAnalytics(app);
