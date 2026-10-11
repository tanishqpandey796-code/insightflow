"use client";

import React from "react";
import { useApp } from "@/components/context/app-context";
import { ImportWizard } from "@/components/import-wizard";
import { AddFeedbackDialog } from "@/components/add-feedback-dialog";

export function GlobalModals() {
  const {
    isImportOpen,
    setIsImportOpen,
    isAddFeedbackOpen,
    setIsAddFeedbackOpen,
  } = useApp();

  return (
    <>
      <ImportWizard
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />
      <AddFeedbackDialog
        isOpen={isAddFeedbackOpen}
        onClose={() => setIsAddFeedbackOpen(false)}
      />
    </>
  );
}
