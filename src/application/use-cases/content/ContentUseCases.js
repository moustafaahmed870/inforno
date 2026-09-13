export const DEFAULT_HOME_CONTENT = {
  heroEyebrow:     'مطعم بيتزا إيطالي أصيل',
  heroTitleLine1:  'حرارة حقيقية',
  heroTitleLine2:  'داخل كل شريحة',
  heroDescription: 'عجينة طازجة يومياً، مكونات مستوردة، وفرن حجري بدرجة ٤٨٥°م — هذه ليست مجرد بيتزا.',
  heroImage:       null, // falls back to the bundled asset when empty
};

/** Reads homepage content, falling back to sane defaults if nothing was saved yet */
export class GetHomeContentUseCase {
  #contentRepo;
  constructor({ contentRepo }) { this.#contentRepo = contentRepo; }

  async execute() {
    const saved = await this.#contentRepo.get('home');
    return { ...DEFAULT_HOME_CONTENT, ...(saved ?? {}) };
  }
}

/** Persists an update to the homepage content (partial patch, merged) */
export class UpdateHomeContentUseCase {
  #contentRepo;
  constructor({ contentRepo }) { this.#contentRepo = contentRepo; }

  async execute(patch) {
    await this.#contentRepo.set('home', patch);
  }
}
