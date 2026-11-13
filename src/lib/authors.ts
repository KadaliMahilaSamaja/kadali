import { getCollection } from 'astro:content';

export interface AuthorProfile {
  name: string;
  role: string;
  photo?: string;
  bio: string;
}

export interface AuthorOverrides {
  photo?: string;
  role?: string;
  bio?: string;
}

const ROLE_LABELS_KN: Record<string, string> = {
  president: 'ಅಧ್ಯಕ್ಷರು',
  vice_president: 'ಉಪಾಧ್ಯಕ್ಷರು',
  secretary: 'ಕಾರ್ಯದರ್ಶಿ',
  joint_secretary: 'ಸಹಕಾರ್ಯದರ್ಶಿ',
  treasurer: 'ಖಜಾಂಚಿ',
  director: 'ನಿರ್ದೇಶಕರು',
  member: 'ಸದಸ್ಯೆ',
};

const KNOWN_AUTHORS: Record<string, AuthorProfile> = {
  'ರೇಣುಕಾ ಶಿವಾನಂದಪ್ಪ': {
    name: 'ರೇಣುಕಾ ಶಿವಾನಂದಪ್ಪ',
    role: 'ಸಂಸ್ಥಾಪಕರು · ಹಿರಿಯ ಮಾರ್ಗದರ್ಶಕರು',
    bio: '1993ರಲ್ಲಿ ಶಿವಮೊಗ್ಗದಲ್ಲಿ ಕದಳಿ ವನಿತಾ ಸಮಾಜವನ್ನು ಸ್ಥಾಪಿಸಿದ ಸಂಸ್ಥಾಪಕರು ಹಾಗೂ ಹಿರಿಯ ಮಾರ್ಗದರ್ಶಕರು. ಮಹಿಳಾ ಜಾಗೃತಿ, ಸಬಲೀಕರಣ ಹಾಗೂ ಶರಣ ಸಾಹಿತ್ಯ ಪ್ರಸಾರದಲ್ಲಿ ಮೂರು ದಶಕಗಳಿಂದ ನಿರಂತರವಾಗಿ ಶ್ರಮಿಸುತ್ತಿರುವ ಹಿರಿಯ ಸೇವಾ ಚೇತನ.',
  },
  'Renuka Shivanandappa': {
    name: 'ರೇಣುಕಾ ಶಿವಾನಂದಪ್ಪ',
    role: 'ಸಂಸ್ಥಾಪಕರು · ಹಿರಿಯ ಮಾರ್ಗದರ್ಶಕರು',
    bio: '1993ರಲ್ಲಿ ಶಿವಮೊಗ್ಗದಲ್ಲಿ ಕದಳಿ ವನಿತಾ ಸಮಾಜವನ್ನು ಸ್ಥಾಪಿಸಿದ ಸಂಸ್ಥಾಪಕರು ಹಾಗೂ ಹಿರಿಯ ಮಾರ್ಗದರ್ಶಕರು. ಮಹಿಳಾ ಜಾಗೃತಿ, ಸಬಲೀಕರಣ ಹಾಗೂ ಶರಣ ಸಾಹಿತ್ಯ ಪ್ರಸಾರದಲ್ಲಿ ಮೂರು ದಶಕಗಳಿಂದ ನಿರಂತರವಾಗಿ ಶ್ರಮಿಸುತ್ತಿರುವ ಹಿರಿಯ ಸೇವಾ ಚೇತನ.',
  },
};

export async function getAuthorProfile(
  authorName: string,
  overrides?: AuthorOverrides,
): Promise<AuthorProfile> {
  const trimmed = authorName.trim();
  let base: AuthorProfile;

  // 1. Check known authors registry
  if (KNOWN_AUTHORS[trimmed]) {
    base = KNOWN_AUTHORS[trimmed];
  } else {
    // 2. Check people collection
    let foundFromPeople: AuthorProfile | null = null;
    try {
      const people = await getCollection('people');
      const matched = people.find(
        (p) =>
          p.data.nameKn?.trim() === trimmed ||
          p.data.name?.trim().toLowerCase() === trimmed.toLowerCase(),
      );

      if (matched) {
        foundFromPeople = {
          name: matched.data.nameKn ?? matched.data.name,
          role: ROLE_LABELS_KN[matched.data.role] ?? 'ಸದಸ್ಯೆ ಹಾಗೂ ಲೇಖಕಿ',
          photo: matched.data.photo,
          bio:
            matched.data.bio ??
            'ಕದಳಿ ವನಿತಾ ಸಮಾಜದ ಸಕ್ರಿಯ ಸದಸ್ಯೆ ಹಾಗೂ ಲೇಖಕಿ.',
        };
      }
    } catch {
      // collection lookup fallback
    }

    if (foundFromPeople) {
      base = foundFromPeople;
    } else {
      // 3. Fallback
      base = {
        name: trimmed,
        role: 'ಲೇಖಕಿ',
        bio: 'ಕದಳಿ ವನಿತಾ ಸಮಾಜದ ಬರಹಗಾರ್ತಿ.',
      };
    }
  }

  // Apply CMS overrides if provided
  return {
    name: base.name,
    role: overrides?.role?.trim() || base.role,
    photo: overrides?.photo?.trim() || base.photo || undefined,
    bio: overrides?.bio?.trim() || base.bio,
  };
}
