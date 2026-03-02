const UseCaseLogger = (useCase, logger, explicitName) => {
	return async (...args) => {
		const useCaseName = explicitName || useCase.name || "AnonymousUseCase";

		logger?.info?.(
			{ useCase: useCaseName, input: args[0] },
			"[START] Executing use case",
		);

		try {
			const result = await useCase(...args);
			logger?.info?.({ useCase: useCaseName }, "[SUCCESS] Use case completed");
			return result;
		} catch (error) {
			if (error.name) {
				logger?.warn?.(
					{ useCase: useCaseName, err: error },
					"[WARNING] Use case failed with known error",
				);
			} else {
				logger?.error?.(
					{ useCase: useCaseName, err: error },
					"[ERROR] Use case failed",
				);
			}
			throw error; // Re-throw so the Controller can catch it
		}
	};
};

module.exports = UseCaseLogger;
