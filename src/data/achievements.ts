export interface Achievement {
  id: string
  name: string
  description: string
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-scan', name: 'First look', description: 'Identify your first item in the scanner.' },
  { id: 'five-scans', name: 'Sharp eye', description: 'Identify 5 items in the scanner.' },
  { id: 'first-log', name: 'Logged it', description: 'Record your first real-world sort.' },
  { id: 'five-logs', name: 'Habit forming', description: 'Log 5 items you sorted in real life.' },
  { id: 'bookworm', name: 'Field guide', description: 'Open 5 entries in the waste database.' },
  { id: 'level-neighborhood', name: 'Block captain', description: 'Finish the neighborhood cleanup.' },
  { id: 'level-sorting', name: 'Line worker', description: 'Finish the sorting facility.' },
  { id: 'level-compost', name: 'Compost cadet', description: 'Finish the compost facility.' },
  { id: 'level-recycling', name: 'Recovery crew', description: 'Finish the recycling facility.' },
  { id: 'level-boss', name: 'Shield breaker', description: 'Clear the Trash Monster challenge.' },
  { id: 'perfect', name: 'No contamination', description: 'Finish any level with no mistakes.' },
  { id: 'all-levels', name: 'Full loop', description: 'Finish every adventure level.' },
  { id: 'all-stars', name: 'Gold standard', description: 'Earn 3 stars on every adventure level.' },
  { id: 'combo-10', name: 'On a roll', description: 'Sort 10 items in a row without a mistake.' },
  { id: 'rush-1500', name: 'Rush hour', description: 'Score 1,500 points in Sort Rush.' },
  { id: 'daily-first', name: 'Daily sorter', description: 'Finish a daily challenge.' },
  { id: 'daily-3', name: 'Three-day streak', description: 'Finish the daily challenge 3 days in a row.' },
  { id: 'review-clear', name: 'Lesson learned', description: 'Clear every item from your review pile.' },
]
