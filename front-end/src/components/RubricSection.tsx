import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { RubricCriterion } from "@/types";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface RubricSectionProps {
  header: string;
  items: RubricCriterion[];
  isLoading?: boolean;
  onItemsChange?: (items: RubricCriterion[]) => void;
}

const RubricSection = ({
  header,
  items,
  isLoading = false,
  onItemsChange,
}: RubricSectionProps) => {
  const exportRubricToExcel = () => {
    try {
      const maxLevels = Math.max(
        ...items.map((criterion) => criterion.levels.length)
      );

      const totalPoints = items.reduce(
        (sum, criterion) => sum + criterion.weight,
        0
      );

      // Create headers
      const headers = [
        "Criteria",
        "Weight",
        ...Array.from(
          { length: maxLevels },
          (_, i) => `Level ${i} (${i * (100 / (maxLevels - 1))}%)`
        ),
      ];

      // Create data rows for criteria
      const data = items.map((criterion) => {
        const row: any = {
          Criteria: criterion.name,
          Weight: criterion.weight,
        };

        // Add level descriptions
        criterion.levels.forEach((level, index) => {
          const levelKey = `Level ${index} (${
            index * (100 / (criterion.levels.length - 1))
          }%)`;
          row[levelKey] = level.description;
        });

        // Fill empty levels with empty strings
        for (let i = criterion.levels.length; i < maxLevels; i++) {
          const levelKey = `Level ${i} (${i * (100 / (maxLevels - 1))}%)`;
          row[levelKey] = "";
        }

        return row;
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([]);

      // Add the main heading as a merged cell
      const headingText = `${header} (Total: ${totalPoints} points)`;
      XLSX.utils.sheet_add_aoa(worksheet, [[headingText]], { origin: "A1" });

      // Add an empty row for spacing
      XLSX.utils.sheet_add_aoa(worksheet, [[""]], { origin: "A2" });

      // Add headers starting from row 3
      XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A3" });

      // Add data starting from row 4
      const dataArray = data.map((row) =>
        headers.map((header) => row[header] || "")
      );
      XLSX.utils.sheet_add_aoa(worksheet, dataArray, { origin: "A4" });

      XLSX.utils.book_append_sheet(workbook, worksheet, header);

      // Set column widths
      const maxWidth = 50;
      const colWidths = headers.map((header) => {
        let maxLength = header.length;
        data.forEach((row) => {
          const cellValue = String(row[header] || "");
          maxLength = Math.max(maxLength, cellValue.length);
        });
        return { wch: Math.min(maxLength + 2, maxWidth) };
      });
      worksheet["!cols"] = colWidths;

      // Get the range of the worksheet
      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");

      // Style the main heading (row 1)
      const headingCell = "A1";
      if (!worksheet[headingCell]) worksheet[headingCell] = { v: headingText };
      worksheet[headingCell].s = {
        font: { bold: true, sz: 18 },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
      };

      // Merge cells for the heading across all columns
      const mergeRange = `A1:${XLSX.utils.encode_col(headers.length - 1)}1`;
      if (!worksheet["!merges"]) worksheet["!merges"] = [];
      worksheet["!merges"].push(XLSX.utils.decode_range(mergeRange));

      // Style the column headers (row 3)
      for (let col = 0; col < headers.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 2, c: col }); // Row 3 (0-indexed as 2)
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 13 },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
        };
      }

      // Style the criteria column (first column) to be bold and larger
      for (let row = 3; row < 3 + data.length; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 12 },
        };
      }

      // Style weight column (second column) to be centered and bold
      for (let row = 3; row < 3 + data.length; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 1 });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 12 },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }

      // Style level columns to wrap text, italic, and add borders
      for (let row = 3; row < 3 + data.length; row++) {
        for (let col = 2; col < headers.length; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!worksheet[cellAddress]) continue;
          worksheet[cellAddress].s = {
            font: { italic: true, sz: 11 },
            alignment: { horizontal: "left", vertical: "top", wrapText: true },
          };
        }
      }

      // Set row heights for better readability
      worksheet["!rows"] = [
        { hpt: 30 }, // Heading row height
        { hpt: 15 }, // Empty row height
        { hpt: 25 }, // Header row height
        ...Array(data.length).fill({ hpt: 60 }), // Data rows height
      ];

      // Generate filename with current date
      const fileName = `${header.replace(/\s+/g, "_")}_Rubric_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, fileName);

      toast.success(`${header} exported successfully!`);
    } catch (error) {
      console.error("Error exporting rubric:", error);
      toast.error("Failed to export rubric");
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-7 w-48" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-6 bg-muted rounded animate-pulse-slow"
          ></div>
        ))}
      </Card>
    );
  }

  const handleCriterionChange = (
    idx: number,
    field: keyof RubricCriterion,
    value: any
  ) => {
    const updated = items.map((criterion, i) => {
      if (i === idx) {
        if (field === "weight") {
          const numValue = parseInt(value) || 0;
          return { ...criterion, [field]: numValue };
        }
        return { ...criterion, [field]: value };
      }
      return criterion;
    });
    onItemsChange && onItemsChange(updated);
  };

  const handleLevelChange = (
    criterionIdx: number,
    levelIdx: number,
    field: "description" | "range",
    value: any
  ) => {
    const updated = items.map((criterion, i) => {
      if (i === criterionIdx) {
        const updatedLevels = criterion.levels.map((level, j) =>
          j === levelIdx ? { ...level, [field]: value } : level
        );
        return { ...criterion, levels: updatedLevels };
      }
      return criterion;
    });
    onItemsChange && onItemsChange(updated);
  };

  // Get maximum number of levels across all criteria
  const maxLevels = Math.max(
    ...items.map((criterion) => criterion.levels.length)
  );

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{header}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={exportRubricToExcel}
          disabled={!items || items.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-3 text-left font-medium">
                Criterion Name
              </th>
              <th className="border border-gray-300 p-3 text-center font-medium">
                Weight
              </th>
              {Array.from({ length: maxLevels }, (_, i) => (
                <th
                  key={i}
                  className="border border-gray-300 p-3 text-center font-medium"
                >
                  Level {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((criterion, criterionIdx) => (
              <tr
                key={criterionIdx}
                className="hover:bg-gray-50"
              >
                <td className="border border-gray-300 p-3">
                  {onItemsChange ? (
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={criterion.name || ""}
                      onChange={(e) =>
                        handleCriterionChange(
                          criterionIdx,
                          "name",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    <span className="font-medium">{criterion.name}</span>
                  )}
                </td>
                <td className="border border-gray-300 p-3 text-center">
                  {onItemsChange ? (
                    <input
                      type="number"
                      className="w-16 p-2 border rounded text-center"
                      value={criterion.weight || 0}
                      onChange={(e) =>
                        handleCriterionChange(
                          criterionIdx,
                          "weight",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    <span className="font-medium">{criterion.weight}</span>
                  )}
                </td>
                {Array.from({ length: maxLevels }, (_, levelIdx) => {
                  const level = criterion.levels[levelIdx];
                  return (
                    <td
                      key={levelIdx}
                      className="border border-gray-300 p-3"
                    >
                      {level ? (
                        <div className="space-y-2">
                          <div>
                            {onItemsChange ? (
                              <textarea
                                className="w-full p-2 text-sm border rounded resize-none"
                                rows={3}
                                value={level.description || ""}
                                placeholder="Description"
                                onChange={(e) =>
                                  handleLevelChange(
                                    criterionIdx,
                                    levelIdx,
                                    "description",
                                    e.target.value
                                  )
                                }
                              />
                            ) : (
                              <p className="text-sm">{level.description}</p>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            {onItemsChange ? (
                              <>
                                <input
                                  type="number"
                                  className="w-12 p-1 text-xs border rounded text-center"
                                  value={level.range?.[0] ?? 0}
                                  placeholder="Min"
                                  onChange={(e) => {
                                    const minValue =
                                      parseInt(e.target.value) || 0;
                                    const maxValue = level.range?.[1] ?? 0;
                                    const newRange: [number, number] = [
                                      minValue,
                                      maxValue,
                                    ];
                                    handleLevelChange(
                                      criterionIdx,
                                      levelIdx,
                                      "range",
                                      newRange
                                    );
                                  }}
                                />
                                <span className="text-xs self-center">-</span>
                                <input
                                  type="number"
                                  className="w-12 p-1 text-xs border rounded text-center"
                                  value={level.range?.[1] ?? 0}
                                  placeholder="Max"
                                  onChange={(e) => {
                                    const minValue = level.range?.[0] ?? 0;
                                    const maxValue =
                                      parseInt(e.target.value) || 0;
                                    const newRange: [number, number] = [
                                      minValue,
                                      maxValue,
                                    ];
                                    handleLevelChange(
                                      criterionIdx,
                                      levelIdx,
                                      "range",
                                      newRange
                                    );
                                  }}
                                />
                              </>
                            ) : (
                              <span className="text-xs text-gray-600">
                                {level.range?.[0] ?? 0} -{" "}
                                {level.range?.[1] ?? 0}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm text-center">
                          -
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default RubricSection;
