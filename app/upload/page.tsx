"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ocrFromImage } from "@/lib/ocr-client";
import Link from "next/link";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setOcrText(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setUploadId(data.uploadId);

      const text = await ocrFromImage(file);
      setOcrText(text);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleParse = async () => {
    if (!ocrText || !uploadId) return;

    setParsing(true);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: ocrText, uploadId }),
      });

      if (!res.ok) throw new Error("Parse failed");

      await queryClient.invalidateQueries({ queryKey: ["friends"] });
      alert("Match saved successfully!");
      setFile(null);
      setOcrText(null);
      setUploadId(null);
    } catch (error) {
      console.error("Parse error:", error);
      alert("Parse failed");
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Upload Match</h1>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
        >
          Back to Dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Screenshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file">Select Image</Label>
            <input
              id="file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {file && (
            <div>
              <p className="text-sm text-muted-foreground">
                Selected: {file.name}
              </p>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-2"
              >
                {uploading ? "Uploading..." : "Upload & OCR"}
              </Button>
            </div>
          )}

          {ocrText && (
            <div className="mt-4">
              <Label>OCR Preview</Label>
              <textarea
                readOnly
                value={ocrText}
                className="mt-2 w-full p-2 border rounded-md min-h-[200px] bg-muted"
              />
              <Button
                onClick={handleParse}
                disabled={parsing}
                className="mt-2"
              >
                {parsing ? "Parsing..." : "Save Match"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
