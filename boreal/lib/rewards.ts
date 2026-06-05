export interface Reward {
  name: string
  cost: number
  tier: number
  imageSrc: string
}

export const REWARDS: Reward[] = [
  { name: 'Notebook Set',  cost: 150,  tier: 500, imageSrc: '/assets/images/NoteBookRed.png' },
  { name: 'ICESI Cap',     cost: 300,  tier: 500, imageSrc: '/assets/images/IcesiCap.png' },
  { name: 'ICESI Bag',     cost: 500,  tier: 500, imageSrc: '/assets/images/IcesiBag.png' },
  { name: 'Lunch Bag',     cost: 600,  tier: 500, imageSrc: '/assets/images/lunchBag.png' },
  { name: 'Andy Notebook', cost: 800,  tier: 1000, imageSrc: '/assets/images/AndyNoteBook.png' },
  { name: 'Hoodie ICESI',  cost: 1000, tier: 1000, imageSrc: '/assets/images/hoodieIcesi.png' },
  { name: 'Jansport',      cost: 1002, tier: 1000, imageSrc: '/assets/images/jansport.png' },
  { name: 'ICESI Cap',     cost: 3200, tier: 1000, imageSrc: '/assets/images/IcesiCap.png' },
]
