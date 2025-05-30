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
    <div className="space-y-6 border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900">Podgląd modyfikacji AI</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Content */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Oryginalna treść</h4>
          <div className="p-4 bg-gray-50 rounded-lg border">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">{originalContent}</pre>
          </div>
        </div>

        {/* Modified Content */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Zmodyfikowana treść (AI)</h4>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">{modifiedContent}</pre>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button onClick={onApprove} className="px-6">
          Zatwierdź zmiany AI
        </Button>

        <Button variant="outline" onClick={onReject} className="px-6">
          Odrzuć zmiany AI
        </Button>
      </div>
    </div>
  );
}
