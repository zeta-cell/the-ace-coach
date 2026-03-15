// Badge definitions and gamification constants
import { Play, Flame, Trophy, Users, MapPin, Star, Video, Crown, ShoppingBag, CheckCircle, Medal, Zap } from "lucide-react";

export const BADGE_DEFINITIONS = [
  { key: 'first_session', name: 'First Session', desc: 'Complete your first booked session', icon: 'play' },
  { key: 'streak_7', name: '7-Day Warrior', desc: 'Train 7 days in a row', icon: 'fire' },
  { key: 'streak_30', name: '30-Day Legend', desc: 'Train 30 days in a row', icon: 'flame' },
  { key: 'program_complete', name: 'Program Completer', desc: 'Finish a full multi-week program', icon: 'trophy' },
  { key: 'referral_5', name: 'Social Ace', desc: 'Refer 5 friends who sign up', icon: 'users' },
  { key: 'cities_3', name: 'Court Explorer', desc: 'Train in 3 different cities', icon: 'map' },
  { key: 'padel_10', name: 'Padel Pioneer', desc: 'Complete 10 padel sessions', icon: 'racket' },
  { key: 'tennis_10', name: 'Tennis Pro', desc: 'Complete 10 tennis sessions', icon: 'ball' },
  { key: 'coaches_5', name: 'Multi-Coach', desc: 'Train with 5 different coaches', icon: 'star' },
  { key: 'videos_10', name: 'Video Star', desc: 'Upload 10 progress videos', icon: 'video' },
  { key: 'top_10', name: 'Top 10', desc: 'Reach top 10 on global leaderboard', icon: 'crown' },
  { key: 'marketplace_seller', name: 'Creator', desc: 'Sell your first program', icon: 'shop' },
  { key: 'profile_complete', name: 'All In', desc: 'Complete your profile 100%', icon: 'check' },
  { key: 'review_first', name: 'Critic', desc: 'Write your first coach review', icon: 'star' },
  { key: 'sessions_10', name: 'Dedicated', desc: 'Complete 10 sessions total', icon: 'medal' },
  { key: 'sessions_50', name: 'Elite Trainer', desc: 'Complete 50 sessions total', icon: 'trophy' },
] as const;

export const LEVEL_CONFIG: Record<string, { label: string; color: string; xpMin: number; xpNext: number }> = {
  bronze: { label: 'Bronze', color: '#CD7F32', xpMin: 0, xpNext: 500 },
  silver: { label: 'Silver', color: '#C0C0C0', xpMin: 500, xpNext: 1500 },
  gold: { label: 'Gold', color: '#FFD700', xpMin: 1500, xpNext: 4000 },
  platinum: { label: 'Platinum', color: '#E5E4E2', xpMin: 4000, xpNext: 10000 },
  diamond: { label: 'Diamond', color: '#B9F2FF', xpMin: 10000, xpNext: 25000 },
  legend: { label: 'Legend', color: '#FF69B4', xpMin: 25000, xpNext: 50000 },
};

export const getNextLevel = (currentLevel: string): string | null => {
  const order = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'];
  const idx = order.indexOf(currentLevel);
  return idx < order.length - 1 ? order[idx + 1] : null;
};

export const LEVEL_PERKS: Record<string, string[]> = {
  bronze: ['Access to marketplace', 'Basic leaderboard'],
  silver: ['5% partner discounts', 'Monthly raffle entry'],
  gold: ['10% partner discounts', 'Priority booking', 'Raffle tickets per session'],
  platinum: ['15% partner discounts', 'VIP coach access', 'Double raffle tickets'],
  diamond: ['20% partner discounts', 'Exclusive events', 'Triple raffle tickets'],
  legend: ['25% partner discounts', 'Free monthly session', 'Legend badge display'],
};
