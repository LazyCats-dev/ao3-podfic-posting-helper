declare global {
  interface Window {
    injectImportAndFillMetadata: (args: {
      url: string;
      podficLabel: boolean;
      podficLengthLabel: boolean;
      podficLengthValue: string;
      titleFormat: string;
      summaryFormat: string;
      audioFormatTagOptionIds: readonly string[];
      workTemplate: string;
      userSummaryTemplate: string;
      userTitleTemplate: string;
      userNotesTemplate: string;
      beginNotes: boolean;
      endNotes: boolean;
    }) => Promise<{result: string; message?: string}>;
  }
}

export {};
