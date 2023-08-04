import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

import { GetSyncResponse } from "@/pages/api/companies/[id]/syncs/[syncId]";

import styles from "./styles.module.scss";
import useAttachments from "./useAttachments";

interface SyncResult {
  succeeded: boolean;
}

const getSyncData = async (companyId: string, syncId: string) => {
  const response = await fetch(`/api/companies/${companyId}/syncs/${syncId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (response.status !== 200) {
    throw new Error("Unable to get sync data");
  }

  const data = await response.json();
  return data as GetSyncResponse;
};

const Result = () => {
  const router = useRouter();
  const companyId = router.query.id as string;
  const syncId = router.query.syncId as string;
  const { getAttachmentCount, popAttachment } = useAttachments();

  const [syncResult, setSyncResult] = useState<GetSyncResponse>();
  const timeoutRef = useRef<number>();
  const totalAttachmentCountRef = useRef<number>();
  const [attachmentCount, setAttachmentCount] = useState(0);

  useEffect(() => {
    getAttachmentCount().then((a) => setAttachmentCount(a));
  }, []);

  const upload = async (transactionId: string, file: File) => {
    const formData = new FormData();
    formData.append(file.name, file);

    try {
      const response = await fetch(
        `/api/companies/${companyId}/syncs/${syncId}/expenses/${transactionId}/attachments`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const initiateAttachmentUpload = async () => {
    let attachment;
    while ((attachment = await popAttachment()) !== undefined) {
      try {
        await upload(attachment!.transactionId, attachment!.file);
      } catch {
        console.error("Failed to upload attachment");
      }
      setAttachmentCount((count) => count - 1);
    }
  };

  useEffect(() => {
    getAttachmentCount().then((data) => {
      totalAttachmentCountRef.current = data;
    });
  }, []);

  useEffect(() => {
    async function getData() {
      if (companyId === undefined) {
        return;
      }
      const data = await getSyncData(companyId, syncId);
      if (data === null) {
        timeoutRef.current = window.setTimeout(() => getData(), 1000);
        return;
      }

      if (data.result === "success") {
        initiateAttachmentUpload();
      }
      setSyncResult(data);
    }

    getData();
    return () => clearTimeout(timeoutRef.current);
  }, [companyId, syncId]);

  if (!syncResult) {
    return <ResultCard header="Sync in progress&hellip;"></ResultCard>
  }
  if (syncResult.result === "failure") {
    return (
      <ResultCard header="Sync failed">
        <p>
          <div>
            <b>Error:</b> {syncResult.errorMessage}
          </div>
        </p>
      </ResultCard>
    );
  }

  if (attachmentCount === 0) {
    return (
      <ResultCard header="Sync succeeded">
        {attachmentCount > 0 && (
          <p>Waiting for {attachmentCount} attachments to be pushed&hellip;</p>
        )}
        {attachmentCount === 0 &&
          (totalAttachmentCountRef.current ?? 0) > 0 && (
            <p>Attachments pushed.</p>
          )}
      </ResultCard>
    );
  }
};

const ResultCard = ({
  header,
  children,
}: {
  header: string;
  children?: React.ReactNode;
}) => (
  <div className={styles.card}>
    <h1 className={styles.header}>{header}</h1>

    {children}
  </div>
);

export default Result;
