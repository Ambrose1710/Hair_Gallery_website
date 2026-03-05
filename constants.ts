
import { Service, Category } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Hair takedown', description: 'Assist the client to loosen their hair' },
  { id: 'cat-2', name: 'Parting assistance', description: 'For those that want to make their own hair but don\'t want to part it' },
  { id: 'cat-3', name: 'Hair braiding', description: 'Professional braiding services' },
  { id: 'cat-4', name: 'Relocking', description: 'Loc maintenance and relocking' }
];

export const INITIAL_SERVICES: Service[] = [
  {
    id: 's-1',
    categoryId: 'cat-1',
    name: 'Braids takedown',
    subName: 'back-length braids',
    price: 5000,
    duration: '90 min',
    description: 'Careful removal of back-length braids.'
  },
  {
    id: 's-2',
    categoryId: 'cat-1',
    name: 'Faux locs takedown',
    subName: 'faux locs',
    price: 7000,
    duration: '120 min',
    description: 'Professional takedown of faux locs to minimize breakage.'
  },
  {
    id: 's-3',
    categoryId: 'cat-2',
    name: 'Part my hair',
    subName: 'small parts',
    price: 3000,
    duration: '45 min',
    description: 'Precision small parts for your DIY styling.'
  },
  {
    id: 's-4',
    categoryId: 'cat-2',
    name: 'Part my hair',
    subName: 'medium parts',
    price: 2500,
    duration: '35 min',
    description: 'Precision medium parts for your DIY styling.'
  },
  {
    id: 's-5',
    categoryId: 'cat-2',
    name: 'Part my hair',
    subName: 'large parts',
    price: 2000,
    duration: '25 min',
    description: 'Precision large parts for your DIY styling.'
  }
];

export const STANDARD_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];
