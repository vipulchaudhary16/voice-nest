import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../services/api";
import DataTable from "../components/DataTable";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function toTitleCase(value) {
  if (!value) return "-";
  return String(value)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function CampaignCallDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [callsLoading, setCallsLoading] = useState(false);
  const [campaignError, setCampaignError] = useState("");
  const [callsError, setCallsError] = useState("");
  const [campaign, setCampaign] = useState(null);
  const [calls, setCalls] = useState([]);
  const [meta, setMeta] = useState({ total: 0, offset: 0, limit: 20 });

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setCampaignLoading(true);
        setCampaignError("");
        setCampaign(null);
        const campaignRes = await api.get(`/campaigns/${id}`);
        setCampaign(campaignRes.data.data);
      } catch (err) {
        setCampaignError(err.response?.data?.message || "Failed to load campaign details");
      } finally {
        setCampaignLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  useEffect(() => {
    if (activeTab !== "call-details") return;

    const fetchCallDetails = async () => {
      try {
        setCallsLoading(true);
        setCallsError("");
        const detailsRes = await api.get(`/campaigns/${id}/call-details`, {
          params: {
            offset: meta.offset,
            limit: meta.limit,
          },
        });

        const details = detailsRes.data.data || {};
        const rows = Array.isArray(details.response)
          ? details.response
              .filter((item) => item?.status === "success" && item?.data)
              .map((item) => item.data)
          : [];

        setCalls(rows);
        setMeta((prev) => ({
          ...prev,
          total: Number(details?.metadata?.total ?? rows.length ?? 0),
          offset: Number(details?.metadata?.offset ?? prev.offset),
          limit: Number(details?.metadata?.limit ?? prev.limit),
        }));
      } catch (err) {
        setCallsError(err.response?.data?.message || "Failed to load campaign call details");
        setCalls([]);
      } finally {
        setCallsLoading(false);
      }
    };

    fetchCallDetails();
  }, [activeTab, id, meta.offset, meta.limit]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "number",
        header: "Number",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-[var(--text-primary)]">{getValue() || "-"}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }) => <span>{getValue() || "-"}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
            {toTitleCase(getValue())}
          </span>
        ),
      },
      {
        accessorKey: "duration",
        header: "Duration (s)",
      },
      {
        accessorKey: "date_created",
        header: "Created At",
        cell: ({ getValue }) => formatDateTime(getValue()),
      },
      {
        accessorKey: "call_sid",
        header: "Call SID",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-[var(--text-secondary)]">{getValue() || "-"}</span>
        ),
      },
    ],
    [],
  );

  const hasNextPage = meta.offset + meta.limit < meta.total;
  const hasPrevPage = meta.offset > 0;

  return (
    <div className="flex min-h-0 flex-1 w-full flex-col gap-4">
      <div className="shrink-0 flex items-center justify-between bg-[var(--bg-card)] p-4 sm:p-5 rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigate("/dashboard/campaigns")}
            className="inline-flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns
          </button>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            {campaign?.name || "Campaign"}
          </h2>
          <p className="text-[var(--text-secondary)]">
            Campaign details and VoiceNest call attempts.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "overview"
              ? "border-indigo-500 text-indigo-600"
              : "border-transparent text-[var(--text-secondary)]"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("call-details")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "call-details"
              ? "border-indigo-500 text-indigo-600"
              : "border-transparent text-[var(--text-secondary)]"
          }`}
        >
          Call Details
        </button>
      </div>

      {campaignError && !campaign ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{campaignError}</div>
      ) : null}

      {activeTab === "overview" ? (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaignLoading ? (
            <p className="text-[var(--text-secondary)]">Loading campaign details...</p>
          ) : (
            <>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Name</p>
                <p className="font-semibold">{campaign?.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Status</p>
                <p className="font-semibold">{campaign?.status || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Campaign Type</p>
                <p className="font-semibold">{campaign?.campaign_type || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Flow Type</p>
                <p className="font-semibold">{campaign?.flow_type || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Caller ID</p>
                <p className="font-semibold">{campaign?.caller_id?.phone_no || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">VoiceNest SID</p>
                <p className="font-mono text-xs">{campaign?.exotel_sid || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Lists</p>
                <p className="font-semibold">
                  {campaign?.lists?.length
                    ? campaign.lists.map((list) => list.name).join(", ")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">URL</p>
                <p className="font-semibold break-all">{campaign?.url || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Read Via Text</p>
                <p className="font-semibold">{campaign?.read_via_text || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Retry Count</p>
                <p className="font-semibold">{campaign?.retries?.number_of_retries ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Schedule Start</p>
                <p className="font-semibold">{formatDateTime(campaign?.schedule?.send_at)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Schedule End</p>
                <p className="font-semibold">{formatDateTime(campaign?.schedule?.end_at)}</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {callsError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{callsError}</div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-auto scroll-smooth">
            <DataTable
              columns={columns}
              data={calls}
              loading={callsLoading}
              emptyMessage="No call details found for this campaign."
            />
          </div>

          {!callsLoading && !callsError ? (
            <div className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3">
              <p className="text-sm text-[var(--text-secondary)]">
                Showing {calls.length} rows | Total: {meta.total}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!hasPrevPage}
                  onClick={() =>
                    setMeta((prev) => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))
                  }
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!hasNextPage}
                  onClick={() => setMeta((prev) => ({ ...prev, offset: prev.offset + prev.limit }))}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
