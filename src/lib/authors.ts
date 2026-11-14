import { getCollection } from 'astro:content';
import { AUTHOR_ROLES, ROLE_LABELS, type Bi } from '../i18n/ui';

/**
 * Author profiles for article bylines. Names, roles and bios stay in their
 * written language (Kannada); the role, when it comes from the committee
 * registry, is bilingual ({ kn, en }) so the About-style chrome can switch.
 * A plain-string role (CMS authorRole override) is treated as Kannada
 * content and never translated.
 */
export interface AuthorProfile {
  name: string;
  /** Bilingual when derived from the role registry; a CMS override stays Kannada. */
  role: Bi | string;
  photo?: string;
  bio: string;
}

export interface AuthorOverrides {
  photo?: string;
  role?: string;
  bio?: string;
}

const KNOWN_AUTHORS: Record<string, AuthorProfile> = {
  'ರೇಣುಕಾ ಶಿವಾನಂದಪ್ಪ': {
    name: 'ರೇಣುಕಾ ಶಿವಾನಂದಪ್ಪ',
    role: AUTHOR_ROLES.founder,
    bio: '1993ರಲ್ಲಿ ಶಿವಮೊಗ್ಗದಲ್ಲಿ ಕದಳಿ ವನಿತಾ ಸಮಾಜವನ್ನು ಸ್ಥಾಪಿಸಿದ ಸಂಸ್ಥಾಪಕರು ಹಾಗೂ ಹಿರಿಯ ಮಾರ್ಗದರ್ಶಕರು. ಮಹಿಳಾ ಜಾಗೃತಿ, ಸಬಲೀಕರಣ ಹಾಗೂ ಶರಣ ಸಾಹಿತ್ಯ ಪ್ರಸಾರದಲ್ಲಿ ಮೂರು ದಶಕಗಳಿಂದ ನಿರಂತರವಾಗಿ ಶ್ರಮಿಸುತ್ತಿರುವ ಹಿರಿಯ ಸೇವಾ ಚೇತನ.',
  },
  'Renuka Shivanandappa': {
    name: 'ರೇಣುಕಾ ಶಿವಾನಂದಪ್ಪ',
    role: AUTHOR_ROLES.founder,
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
          role: ROLE_LABELS[matched.data.role] ?? AUTHOR_ROLES.memberAuthor,
          photo: matched.data.photo,
          bio: matched.data.bio ?? AUTHOR_ROLES.memberBioFallback.kn,
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
        role: AUTHOR_ROLES.fallback,
        bio: AUTHOR_ROLES.writerFallback.kn,
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
