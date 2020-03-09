import { Firestore } from '@google-cloud/firestore';

const db = new Firestore()

db.collection('users').doc('1').set({ name: "Alice" });
db.collection('users').doc('2').set({ name: "Bob" });
db.collection('users').doc('3').set({ name: "Charlie" });

db.collection('city').doc('Tokyo').set({ name: "東京", district: "関東" });
db.collection('city').doc('Osaka').set({ name: "大阪", district: "関西" });
db.collection('city').doc('Kyoto').set({ name: "京都", district: "関西" });
