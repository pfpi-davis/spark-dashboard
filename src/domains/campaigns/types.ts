export interface CampaignDate {
  id: string
  date: string
  description: string
}

export interface LinkedItem {
  pluginId: 'areas' | 'writer' | string
  itemId: string
  title: string
}

export interface Campaign {
  id: string
  title: string
  tags: string[]
  goals: {
    narrative: string
    lineItems: string[]
  }
  dates: CampaignDate[]
  linkedItems: LinkedItem[]
  createdAt: any
  updatedAt: any
  isArchived: boolean
}
