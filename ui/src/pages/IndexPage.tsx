import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { getLastUnreviewedGeneration } from "@/api/generations";
import NoUnreviewedGenerationFound from "@/components/generations/NoUnreviewedGenerationFound";
import { useAlert } from "@/context/AlertContext";
import { logger } from "@/lib/logger";

export default function IndexPage() {
  const [lastUnreviewedGenId, setLastUnreviewedGenId] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { reportError } = useAlert();
  useEffect(() => {
    async function getLastUploaded() {
      try {
        const result = await getLastUnreviewedGeneration();
        const lastId = result.at(-1);
        if (lastId && lastId > 0) {
          setLastUnreviewedGenId(lastId);
          await navigate(`/review-console/${lastId}`);
        }
      } catch (error) {
        logger.api({ loc: "getLastUploaded", error });
        void reportError(error, {
          title: `Error fetching unreviewed generation.`,
        });
      } finally {
        setLoading(false);
      }
    }

    void getLastUploaded();
  }, [navigate, reportError]);

  return (
    <>
      {loading && <div>Loading...</div>}
      {lastUnreviewedGenId === 0 && <NoUnreviewedGenerationFound />}
    </>
  );
}
