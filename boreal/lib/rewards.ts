export interface Reward {
  name: string
  cost: number
  tier: number
  imageSrc: string
}

export const REWARDS: Reward[] = [
  { name: 'Andy Notebook', cost: 1500, tier: 2000, imageSrc: '/assets/images/AndyNoteBook.png' },
  { name: 'Lunch Bag',     cost: 1800, tier: 2000, imageSrc: '/assets/images/lunchBag.png' },
  { name: 'ICESI Bag',     cost: 2000, tier: 2000, imageSrc: '/assets/images/IcesiBag.png' },
  { name: 'Coffee Mug',    cost: 2500, tier: 4000, imageSrc: '/assets/images/Mug.png' },
  { name: 'Notebook Set',  cost: 2800, tier: 4000, imageSrc: '/assets/images/notes.png' },
  { name: 'ICESI Cap',     cost: 3200, tier: 4000, imageSrc: '/assets/images/IcesiCap.png' },
  { name: 'Jansport',      cost: 3500, tier: 4000, imageSrc: '/assets/images/jansport.png' },
  { name: 'Hoodie ICESI',  cost: 3800, tier: 4000, imageSrc: '/assets/images/hoodieIcesi.png' },
]
