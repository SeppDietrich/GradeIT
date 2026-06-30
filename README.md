# 📊 GradeIt

**Aplicație web de grading multi-criterial** — creează sisteme personalizate de evaluare pentru orice îți dorești (produse, servicii, decizii), cu criterii configurabile și calcul automat al scorului global ponderat.

[![Angular](https://img.shields.io/badge/Angular-17-DD0031?logo=angular)](https://angular.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Spark-FFCA28?logo=firebase)](https://firebase.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green)](#licență)

---

## 📖 Cuprins

- [Despre proiect](#despre-proiect)
- [Funcționalități](#funcționalități)
- [Tehnologii utilizate](#tehnologii-utilizate)
- [Arhitectură](#arhitectură)
- [Instalare](#instalare)
- [Configurare Firebase](#configurare-firebase)
- [Rulare locală](#rulare-locală)
- [Deploy](#deploy)
- [Structura proiectului](#structura-proiectului)
- [Ghid de utilizare](#ghid-de-utilizare)
- [Roluri și permisiuni](#roluri-și-permisiuni)
- [Licență](#licență)

---

## Despre proiect

GradeIt rezolvă o problemă simplă dar omniprezentă: cum compari obiectiv mai multe variante pe baza mai multor criterii? În loc de evaluări informale și subiective, GradeIt permite definirea unor criterii cu ponderi proprii, acordarea de note de la 1 la 10 pentru fiecare element, și calculul automat al unui scor global ponderat.

Exemplu: vrei să compari cafenele din oraș după gust, preț și locație? Creezi o listă, definești criteriile cu ponderile dorite, adaugi cafenelele evaluate, iar aplicația calculează automat clasamentul.

## Funcționalități

- 🔐 **Autentificare** — email/parolă sau cont Google (Firebase Authentication)
- 📝 **Liste de grading personalizate** — titlu, descriere, emoji reprezentativ
- ⚖️ **Criterii cu ponderi configurabile** — validare automată ca suma să fie 100%
- 🎯 **Scor global ponderat** — calculat automat la fiecare evaluare
- 🌍 **Partajare publică** — orice listă poate fi făcută vizibilă tuturor utilizatorilor
- 🔄 **Sincronizare în timp real** — modificările apar instant pe toate dispozitivele (Firestore)
- 👥 **Sistem de roluri** — utilizator standard și administrator, cu panou de administrare dedicat
- 📤 **Export CSV** — descarcă orice listă cu toate scorurile
- 🌐 **Multilingv** — română, engleză, rusă
- 🌗 **Temă Dark/Light** — comutare instant, salvată local

## Tehnologii utilizate

| Categorie | Tehnologie |
|---|---|
| Front-end | [Angular 17](https://angular.dev) (standalone components) + TypeScript |
| State management | RxJS (Observables, BehaviorSubject) |
| Backend / BaaS | [Firebase](https://firebase.google.com) — Authentication, Firestore, Hosting |
| Stilizare | SCSS + variabile CSS pentru theming |
| Build tool | Angular CLI / Vite |

## Arhitectură

Aplicația respectă o arhitectură pe trei niveluri:

```
┌─────────────────────────┐
│   Prezentare (Angular)  │  ← componente standalone
├─────────────────────────┤
│  Servicii (logică)      │  ← AuthService, GradingListService, AdminService
├─────────────────────────┤
│  Date (Firebase)        │  ← Firestore + Authentication
└─────────────────────────┘
```

Schema Firestore:

```
users/{userId}
  ├── uid, email, role, displayName, createdAt
  └── gradingLists/{listId}
        ├── title, emoji, description, isPublic
        ├── criteria: [{ id, name, weight }]
        └── items: [{ id, name, scores[], overallScore }]

publicLists/{listId}      ← copie a listelor publice, pentru explorare rapidă
_meta/userCount            ← folosit pentru atribuirea automată a rolului admin
```

Formula scorului global:

```
overallScore = Σ (scoreᵢ × weightᵢ) / totalWeight
```

## Instalare

### Cerințe

- [Node.js](https://nodejs.org) 18+ și npm
- [Angular CLI](https://angular.dev/tools/cli): `npm install -g @angular/cli`
- Un cont [Firebase](https://console.firebase.google.com) (gratuit, Spark Plan)

### Pași

```bash
git clone <repo-url> gradeit
cd gradeit
npm install
```

## Configurare Firebase

1. Creează un proiect nou în [Firebase Console](https://console.firebase.google.com)
2. Activează **Authentication** → Sign-in methods: `Email/Password` și `Google`
3. Activează **Firestore Database** → pornește în modul production
4. Project Settings → Your apps → adaugă o aplicație Web (`</>`) și copiază `firebaseConfig`
5. Creează fișierul `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
  }
};
```

6. Publică regulile de securitate din `firestore.rules` în Firestore Console → tab **Rules** → Publish

## Rulare locală

```bash
ng serve
```

Aplicația pornește la `http://localhost:4200`. Primul cont înregistrat devine automat **administrator**.

## Deploy

```bash
ng build --configuration production
npm install -g firebase-tools
firebase login
firebase init hosting   # public dir: dist/gradeit/browser, SPA: yes
firebase deploy
```

## Structura proiectului

```
src/app/
├── core/
│   ├── auth/              # AuthService, guard-uri, model utilizator
│   ├── firestore/         # GradingListService, AdminService
│   ├── i18n/               # TranslateService + pipe
│   ├── theme/              # ThemeService (dark/light)
│   ├── export/              # ExportService (CSV)
│   └── models.ts            # interfețe TypeScript + calculateOverallScore
├── features/
│   ├── home/                # autentificare
│   ├── grading-lists/       # dashboard liste proprii
│   ├── grade-editor/        # creare/editare liste și elemente
│   ├── public-view/         # explorare + detaliu liste publice
│   └── admin/                # panou de administrare
└── shared/components/navbar/ # bară de navigare globală
```

## Ghid de utilizare

1. **Autentifică-te** cu Google sau email/parolă
2. Apasă **+ Listă nouă**, completează titlul, emoji-ul și criteriile cu ponderile dorite (suma trebuie să fie 100%)
3. Salvează lista, apoi adaugă elemente și acordă note de la 1 la 10 pentru fiecare criteriu
4. Scorul global se calculează automat și elementele se sortează descrescător
5. Activează toggle-ul **Listă publică** pentru a o partaja cu toți utilizatorii
6. Exportă oricând o listă în CSV din meniul dropdown **Listele mele** din navbar

## Roluri și permisiuni

| Acțiune | Utilizator | Administrator |
|---|:---:|:---:|
| Creare/editare liste proprii | ✅ | ✅ |
| Vizualizare liste publice | ✅ | ✅ |
| Export CSV | ✅ | ✅ |
| Acces panou Admin | ❌ | ✅ |
| Modificare rol utilizatori | ❌ | ✅ |
| Ștergere orice utilizator/listă | ❌ | ✅ |

> Primul utilizator înregistrat în sistem primește automat rolul de `admin`.

## Licență

Acest proiect a fost realizat în cadrul stagiului de practică la **Cybercor**, Colegiul Universității Tehnice a Moldovei, specialitatea Administrarea Aplicațiilor WEB.

---

<div align="center">

**GradeIt** — Evaluează. Compară. Decide.

</div>
