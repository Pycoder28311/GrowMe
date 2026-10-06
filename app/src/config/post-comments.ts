// Example comments under a post (until they come from the API's blog comments and likes)

export type PostComment = {
  id: string;
  author: string;
  /** e.g. "2 ημέρες πριν" */
  date: string;
  text: string;
  replyCount: number;
  likeCount: number;
};

export const EXAMPLE_COMMENTS: PostComment[] = [
  {
    id: 'c1',
    author: 'Μαρία',
    date: '2 ημέρες πριν',
    text: 'Έβαλα θυμάρι και λεβάντα στο ίδιο ζαρντινιέρο και πάνε τέλεια!',
    replyCount: 2,
    likeCount: 5,
  },
  {
    id: 'c2',
    author: 'Νίκος',
    date: '1 εβδομάδα πριν',
    text: 'Ο δυόσμος μου απλώθηκε παντού, καλά λέτε να μπαίνει μόνος του.',
    replyCount: 0,
    likeCount: 3,
  },
];
