import React from "react";
import { Button } from "./ui/button";

interface AIPreviewSectionProps {
  originalContent: string;
  modifiedContent: string;
  onApprove: () => void;
  onReject: () => void;
}

export default function AIPreviewSection({
  originalContent,
  modifiedContent,
  onApprove,
  onReject,
}: AIPreviewSectionProps) {
  return (
    <div className="space-y-6 border-t pt-6" data-testid="ai-preview-section">
      <h3 className="text-lg font-semibold text-gray-900" data-testid="ai-preview-title">
        Podgląd modyfikacji AI
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="ai-preview-content-comparison">
        {/* Original Content */}
        <div className="space-y-2" data-testid="ai-preview-original-section">
          <h4 className="font-medium text-gray-700" data-testid="ai-preview-original-title">
            Oryginalna treść
          </h4>
          <div className="p-4 bg-gray-50 rounded-lg border" data-testid="ai-preview-original-content">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">{originalContent}</pre>
          </div>
        </div>

        {/* Modified Content */}
        <div className="space-y-2" data-testid="ai-preview-modified-section">
          <h4 className="font-medium text-gray-700" data-testid="ai-preview-modified-title">
            Zmodyfikowana treść (AI)
          </h4>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200" data-testid="ai-preview-modified-content">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">{modifiedContent}</pre>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center" data-testid="ai-preview-actions">
        <Button onClick={onApprove} className="px-6" data-testid="ai-preview-approve-button">
          Zatwierdź zmiany AI
        </Button>

        <Button variant="outline" onClick={onReject} className="px-6" data-testid="ai-preview-reject-button">
          Odrzuć zmiany AI
        </Button>
      </div>
    </div>
  );
}
