import type { ImageSourcePropType } from 'react-native';

// Example posts for the Encyclopedia (until they come from the API's blogs).
// Photos reuse the app's own images.

export type WikiCategory = 'tips' | 'glossary';

/** A piece of a post's text: a paragraph, or a heading that starts a part (e.g. "1. Θυμάρι") */
export type PostBlock = { type: 'paragraph' | 'heading'; text: string };

export type WikiPost = {
  id: string;
  title: string;
  category: WikiCategory;
  /** Shown next to the title, e.g. "12 Μαΐου 2026" */
  date: string;
  /** Reading time in minutes, shown in a corner badge */
  readMinutes: number;
  image: ImageSourcePropType;
  content: PostBlock[];
};

export const WIKI_TABS: { id: 'all' | WikiCategory; label: string }[] = [
  { id: 'all', label: 'Όλα' },
  { id: 'tips', label: 'Συμβουλές' },
  { id: 'glossary', label: 'Γλωσσάρι' },
];

const p = (text: string): PostBlock => ({ type: 'paragraph', text });
const h = (text: string): PostBlock => ({ type: 'heading', text });

export const WIKI_POSTS: WikiPost[] = [
  {
    id: 'top-5-small-pots',
    title: 'Τοπ 5 φυτά για μικρές γλάστρες',
    category: 'tips',
    date: '12 Μαΐου 2026',
    readMinutes: 3,
    image: require('@/assets/images/backgrounds/balcony-hanging-pots.webp'),
    content: [
      p('Μικρός χώρος δεν σημαίνει ότι πρέπει να περιορίσεις το πράσινο. Επιλέξαμε 5 φυτά που μπορούν να προσαρμοστούν καλά σε ένα μικρό μπαλκόνι, με διαφορετικές ανάγκες σε ήλιο, νερό και χώρο.'),
      h('1. Θυμάρι κεφαλωτό'),
      p('Ανθεκτικό, αρωματικό και με χαμηλές ανάγκες σε νερό. Ιδανικό για ηλιόλουστα μπαλκόνια.'),
      h('2. Βασιλικός'),
      p('Μεγαλώνει γρήγορα σε γλάστρα 15–20 cm και θέλει πότισμα μόλις στεγνώσει η επιφάνεια.'),
      h('3. Γεράνι'),
      p('Ανθίζει σχεδόν όλο τον χρόνο και αντέχει τον ήλιο και τον αέρα.'),
      h('4. Δυόσμος'),
      p('Προτιμά την ημισκιά· φύτεψέ τον μόνο του γιατί απλώνεται γρήγορα.'),
      h('5. Λεβάντα'),
      p('Λίγο νερό, πολύς ήλιος και ένα κλάδεμα μετά την ανθοφορία.'),
    ],
  },
  {
    id: 'watering-in-summer',
    title: 'Πώς ποτίζουμε σωστά το καλοκαίρι',
    category: 'tips',
    date: '3 Ιουνίου 2026',
    readMinutes: 4,
    image: require('@/assets/images/backgrounds/balcony-geraniums-sea-view.webp'),
    content: [
      p('Το καλοκαίρι οι γλάστρες στεγνώνουν πολύ πιο γρήγορα από το χώμα του κήπου. Λίγοι απλοί κανόνες κρατούν τα φυτά σου δροσερά.'),
      h('Πότισε νωρίς το πρωί'),
      p('Το νερό φτάνει στις ρίζες πριν το εξατμίσει ο ήλιος, και τα φύλλα στεγνώνουν μέχρι το βράδυ.'),
      h('Λιγότερα αλλά βαθιά ποτίσματα'),
      p('Πότιζε μέχρι να τρέξει νερό από την τρύπα· έτσι οι ρίζες πάνε βαθιά.'),
    ],
  },
  {
    id: 'what-is-partial-shade',
    title: 'Τι σημαίνει «ημισκιά»;',
    category: 'glossary',
    date: '20 Απριλίου 2026',
    readMinutes: 2,
    image: require('@/assets/images/backgrounds/alley-potted-plants.webp'),
    content: [
      p('Ημισκιά σημαίνει 3 έως 6 ώρες ήλιο την ημέρα, συνήθως τον πρωινό ήλιο ή φως φιλτραρισμένο μέσα από φύλλα ή τέντα.'),
      p('Φυτά ημισκιάς, όπως ο δυόσμος και το μαρούλι, καίγονται συχνά στον μεσημεριανό ήλιο του καλοκαιριού.'),
    ],
  },
  {
    id: 'herbs-for-the-kitchen',
    title: 'Αρωματικά για την κουζίνα σε ένα μπαλκόνι',
    category: 'tips',
    date: '8 Μαρτίου 2026',
    readMinutes: 5,
    image: require('@/assets/images/backgrounds/balcony-street-shelves.webp'),
    content: [
      p('Με ένα ράφι και τέσσερις γλάστρες έχεις φρέσκα αρωματικά όλο τον χρόνο.'),
      h('Ξεκίνα με τα εύκολα'),
      p('Βασιλικός, δυόσμος, μαϊντανός και ρίγανη θέλουν λίγη φροντίδα και πολύ λίγο χώρο.'),
    ],
  },
  {
    id: 'what-is-drainage',
    title: 'Αποστράγγιση: γιατί η γλάστρα θέλει τρύπα',
    category: 'glossary',
    date: '15 Φεβρουαρίου 2026',
    readMinutes: 2,
    image: require('@/assets/images/backgrounds/terrace-lemon-trees-sea.webp'),
    content: [
      p('Αποστράγγιση είναι η διαδρομή που βρίσκει το περισσευούμενο νερό για να φύγει από τη γλάστρα.'),
      p('Χωρίς τρύπα το νερό λιμνάζει, οι ρίζες δεν παίρνουν αέρα και σαπίζουν. Ένα στρώμα από χαλίκια στον πάτο βοηθά ακόμα περισσότερο.'),
    ],
  },
  {
    id: 'tropical-balcony',
    title: 'Τροπικό μπαλκόνι: τι αντέχει στον ήλιο',
    category: 'tips',
    date: '27 Ιανουαρίου 2026',
    readMinutes: 6,
    image: require('@/assets/images/backgrounds/balcony-tropical-sunset.webp'),
    content: [
      p('Οι φοίνικες και τα μεγάλα φύλλα δίνουν αμέσως διακοπές στο μπαλκόνι, αλλά δεν αντέχουν όλα τον μεσογειακό ήλιο.'),
      h('Για πλήρη ήλιο'),
      p('Μπανανιά, στρελίτσια και βουκαμβίλια αγαπούν τη ζέστη, αρκεί να έχουν μεγάλη γλάστρα.'),
    ],
  },
];
