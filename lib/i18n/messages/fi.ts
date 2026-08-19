import type { Messages } from "./en";
import { en } from "./en";

export const fi = {
  ...en,
  common: {
    ...en.common,
    appName: "Itsenäinen Aitta",
    save: "Tallenna",
    cancel: "Peruuta",
    signIn: "Kirjaudu sisään",
    signOut: "Kirjaudu ulos",
    returnToAitta: "Palaa Aittaan",
    viewAsJson: "Näytä JSON",
    published: "Julkaistu",
    updates: "Päivitykset",
    destination: "Kohde",
    noPublishedUpdatesYet: "Ei julkaistuja päivityksiä vielä",
    returnLabel: "Palaa",
    skipToMainContent: "Siirry päätarkoitukseen",
    next: "Seuraava",
    previous: "Edellinen",
  },
  profile: {
    ...en.profile,
    optionalIdentity: "Profiili on vapaaehtoinen",
    noneYet: "Ei profiilia vielä",
  },
  home: {
    ...en.home,
    aittaStorageUnavailable: "Aitta:n tallennus ei ole käytettävissä",
    unavailableTitle: "Tätä Aittaa ei voi ladata juuri nyt",
    tryAgain: "Yritä uudelleen",
    setUpYourOwnAitta: "Luo oma Aittasi",
    startWithOnePrompt: "Aloita yhdellä kehotteella",
    updatesHeading: "Päivitykset",
    aboutTitle: "Tietoja",
    readFullAbout: "Lue täydellinen kuvaus",
    profileDetails: "Profiilin tiedot",
    locationLabel: "Sijainti",
    websiteLabel: "Verkkosivu",
    noUpdatesMessage: {
      ready:
        "Tämä Aitta on jo toimiva. Ensimmäinen päivitys näkyy tässä, kun se on valmis.",
      unconfigured:
        "Julkaistut päivitykset näkyvät täällä, kun omistaja määrittää tämän Aittan profiilin.",
    },
    unconfiguredIntro: {
      ...en.home.unconfiguredIntro,
      firstParagraph:
        "Aitta on itsenäisesti hallinnoitu AittaSocial-sovellus. Se säilyttää päätäntävallan identiteetistään, sisällöstään, määrityksistään ja paikallisesti tallennetusta datasta, riippumatta siitä onko se julkisesti saatavilla, yksityinen tai irrottautunut AittaSocial Hubista.",
      secondParagraph:
        "Profiili on Aittan valinnainen ulkoinen esittely. Tämä Aitta ei vielä omaa profiilia eikä sillä ole aktiivista Hub-yhteyttä. Kopioi ja syötä tämä kehotteke ChatGPT:lle, jotta käyttöönotto pysyy yksityisenä, käytössä on oikea sivusto ja saat opastuksen ensimmäiseen identiteettiin.",
    },
  },
  owner: {
    ...en.owner,
    yourAitta: "Aittasi",
    dashboardTitleFresh: "Viimeistele identiteetti",
    dashboardTitleIncomplete: "Viimeistele identiteetti",
    updatesSectionTitle: "Päivitykset",
    identitySummary: {
      ...en.owner.identitySummary,
      ready: "Identiteetti valmis",
      incomplete: "Identiteetti kesken",
      fresh: "Identiteettiä ei ole aloitettu",
      statusIncomplete: "Identiteetti kesken",
      statusNotStarted: "Identiteettiä ei aloitettu",
      completeAction: "Määritä identiteetti",
      continueIdentity: "Viimeistele identiteetti",
      publishedTitle: "Ensimmäinen päivityksesi on julkinen",
      publishedMessage:
        "Päivitys näkyy julkisesti Aittassasi. Voit hallita kaikkia päivityksiä alta.",
      readyAction: "Tarkastele julkista Aittaa",
      draftAction: "Luo ensimmäinen luonnos",
      draftResumeAction: "Jatka ensimmäistä luonnosta",
      draftTitle: "Jatka ensimmäistä luonnosta",
      publishedPreviewAction: "Esikatsele julkista Aittaa",
    },
    emptyState: {
      ...en.owner.emptyState,
      headline: "Ei vielä hallittavaa",
      body: "Luo luonnos, kehitä sitä yksityisesti ja julkaise kun se on valmis.",
    },
    nextStep: {
      ...en.owner.nextStep,
      identityHeading: "Määritä julkinen identiteetti",
      identityMessageFresh:
        "Suojattu julkinen URL on valmis. Lisää ja tallenna julkinen identiteetti viimeistelläksesi asetukset.",
      identityMessageIncomplete:
        "Lisää kanoninen URL. Tallennetulla identiteetillä tulee olla kelvollinen HTTPS-kansallinen URL julkisia linkkejä varten.",
      defaultMessage:
        "Se on näkyvissä julkisessa Aittassasi. Voit hallita kaikkia päivityksiä alta.",
      draftMessage:
        "Työ säilytetään tässä Aittassa ja pysyy yksityisenä, kunnes julkaiset sen.",
      freshMessage:
        "Aloita yksityisestä luonnoksesta. Mitään ei tule julkiseksi ennen julkaisua.",
      identityMessageFreshNoRuntime:
        "Lisää julkinen identiteetti ja vahvistettu HTTPS-osoite.",
      status: {
        ...en.owner.nextStep.status,
        ready: "Identiteetti valmis",
        readyPublished: "Valmis",
        published: "Julkaistu",
        draftSavedPrivately: "Luonnos tallennettu yksityisesti",
        notReady: "Identiteetti puutteellinen",
      },
      progressLabel: "Identiteetin edistyminen",
      progressSuffix: "2 vaatimuksesta täytetty",
      publicUrlLabel: "Julkinen URL ·",
      publicUrlSource: {
        ...en.owner.nextStep.publicUrlSource,
        runtime: "suojattu Sivuston asetus",
        profile: "tallennettu identiteetti",
      },
    },
  },
  deploymentPrompt: {
    ...en.deploymentPrompt,
    help: "Valitse tämä kehotteen teksti ja kopioi se ChatGPT:lle oman Aittasi perustamiseksi.",
  },
  entry: {
    ...en.entry,
    noTitleFallback: {
      ...en.entry.noTitleFallback,
      updateFrom: "Päivitys lähteestä",
      kindUpdateFrom: " päivitys lähteestä",
    },
    destination: "Kohde",
    sourceUpdateLabel: "Päivitystoiminnot",
    updatesAriaPrefix: "Avaa julkaistu päivitys",
  },
  routes: {
    ...en.routes,
    technical: "Tekninen",
    privacy: "Tietosuoja",
    publicResourcesTitle: "Julkiset resurssit tälle Aittalle",
  },

  ui: {
    ...en.ui,
  },
} as unknown as Messages;
