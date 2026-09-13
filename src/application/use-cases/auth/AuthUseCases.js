export class LoginUseCase {
  #authService;
  constructor({ authService }) { this.#authService = authService; }
  execute(email, password) { return this.#authService.login(email, password); }
}

export class LogoutUseCase {
  #authService;
  constructor({ authService }) { this.#authService = authService; }
  execute() { return this.#authService.logout(); }
}

/** @returns {Promise<{uid,email,isAdmin}|null>} */
export class GetCurrentUserUseCase {
  #authService;
  constructor({ authService }) { this.#authService = authService; }
  execute() { return this.#authService.getCurrentUser(); }
}
