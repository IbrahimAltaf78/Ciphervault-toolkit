import type { ChannelHistogram } from "@/lib/steganalysis/types";

/**
 * The chart data as a table.
 *
 * Not decoration: it is the fallback that keeps the distribution readable when
 * colour is unavailable — printed, in forced-colours mode, or to a screen
 * reader — so identity is never carried by the marks alone.
 */
export function HistogramTable({ histograms }: { histograms: ChannelHistogram[] }) {
  return (
    <details className="group">
      <summary className="cv-label cursor-pointer select-none hover:text-foreground">
        View as table
      </summary>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">
            Low bit counts and split percentage for each channel
          </caption>
          <thead>
            <tr className="border-b border-edge">
              <th scope="col" className="cv-label py-2 pr-4 font-medium">Channel</th>
              <th scope="col" className="cv-label py-2 pr-4 font-medium">LSB = 0</th>
              <th scope="col" className="cv-label py-2 pr-4 font-medium">LSB = 1</th>
              <th scope="col" className="cv-label py-2 font-medium">Split</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            {histograms.map((histogram) => {
              const total = histogram.lsb.zeros + histogram.lsb.ones || 1;
              return (
                <tr key={histogram.channel} className="border-b border-edge/60">
                  <th scope="row" className="py-2 pr-4 font-normal">
                    {histogram.channel}
                  </th>
                  <td className="py-2 pr-4">{histogram.lsb.zeros.toLocaleString()}</td>
                  <td className="py-2 pr-4">{histogram.lsb.ones.toLocaleString()}</td>
                  <td className="py-2">
                    {((histogram.lsb.zeros / total) * 100).toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default HistogramTable;
