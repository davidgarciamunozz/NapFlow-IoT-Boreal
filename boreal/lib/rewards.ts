export interface Reward {
  name: string
  cost: number
  tier: number
  imageSrc: string
}

export const REWARDS: Reward[] = [
  { name: 'Key Charm',    cost: 800,  tier: 2000, imageSrc: '/assets/images/keyCharm.png' },
  { name: 'Pencils',      cost: 1000, tier: 2000, imageSrc: '/assets/images/pencils.png' },
  { name: 'Andy Plushie', cost: 1200, tier: 2000, imageSrc: '/assets/images/AndyPlushie.png' },
  { name: 'ICESI Bag',    cost: 1800, tier: 2000, imageSrc: '/assets/images/IcesiBag.png' },
  { name: 'Coffee Mug',   cost: 2500, tier: 4000, imageSrc: '/assets/images/Mug.png' },
  { name: 'Notebook Set', cost: 2800, tier: 4000, imageSrc: '/assets/images/notes.png' },
  { name: 'ICESI Cap',    cost: 3200, tier: 4000, imageSrc: '/assets/images/IcesiCap.png' },
  { name: 'Hoodie ICESI', cost: 3800, tier: 4000, imageSrc: '/assets/images/hoodieIcesi.png' },
]
