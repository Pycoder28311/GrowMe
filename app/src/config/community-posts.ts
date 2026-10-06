// Example community posts (users' questions) for the Messages tab, until they come from the
// API's posts and post replies. Replies can be answered too, so they nest like on Reddit.

export type Reply = {
  id: string;
  author: string;
  date: string;
  text: string;
  likeCount: number;
  replies: Reply[];
};

export type CommunityPost = Reply & {
  /** For "Πιο πρόσφατα" sorting (larger = newer) */
  createdAt: number;
};

export const EXAMPLE_POSTS: CommunityPost[] = [
  {
    id: 'p1',
    author: 'Ελένη',
    date: '1 ώρα πριν',
    createdAt: 5,
    text: 'Η ντομάτα μου έχει κίτρινα φύλλα στη βάση. Είναι από το πολύ νερό;',
    likeCount: 4,
    replies: [
      {
        id: 'p1-r1',
        author: 'Γιώργος',
        date: '45 λεπτά πριν',
        text: 'Συνήθως ναι, ή από έλλειψη αζώτου. Στεγνώνει το χώμα ανάμεσα στα ποτίσματα;',
        likeCount: 3,
        replies: [
          {
            id: 'p1-r1-r1',
            author: 'Ελένη',
            date: '30 λεπτά πριν',
            text: 'Όχι πολύ, ποτίζω κάθε μέρα. Θα το αραιώσω!',
            likeCount: 1,
            replies: [],
          },
        ],
      },
      {
        id: 'p1-r2',
        author: 'Κατερίνα',
        date: '20 λεπτά πριν',
        text: 'Κόψε τα κίτρινα φύλλα, είναι φυσιολογικό στα κάτω φύλλα.',
        likeCount: 2,
        replies: [],
      },
    ],
  },
  {
    id: 'p2',
    author: 'Νίκος',
    date: '3 ώρες πριν',
    createdAt: 4,
    text: 'Ποιο φυτό αντέχει σε μπαλκόνι με βοριά και λίγο ήλιο;',
    likeCount: 9,
    replies: [
      {
        id: 'p2-r1',
        author: 'Μαρία',
        date: '2 ώρες πριν',
        text: 'Ο κισσός και η φτέρη τα πάνε πολύ καλά στη σκιά.',
        likeCount: 5,
        replies: [],
      },
    ],
  },
  {
    id: 'p3',
    author: 'Σοφία',
    date: 'Χθες',
    createdAt: 3,
    text: 'Πόσο συχνά λιπαίνετε τα αρωματικά σε γλάστρα;',
    likeCount: 2,
    replies: [],
  },
  {
    id: 'p4',
    author: 'Άρης',
    date: '2 ημέρες πριν',
    createdAt: 2,
    text: 'Η λεβάντα μου ξεράθηκε μετά το κλάδεμα. Θα ξαναβγάλει;',
    likeCount: 6,
    replies: [
      {
        id: 'p4-r1',
        author: 'Δήμητρα',
        date: '2 ημέρες πριν',
        text: 'Αν δεν την έκοψες μέχρι το ξύλο, ναι. Δώσε της λίγο χρόνο και λίγο νερό.',
        likeCount: 4,
        replies: [],
      },
    ],
  },
];

/** All replies under a post or reply, at any depth */
export const countReplies = (item: { replies: Reply[] }): number =>
  item.replies.reduce((total, reply) => total + 1 + countReplies(reply), 0);
