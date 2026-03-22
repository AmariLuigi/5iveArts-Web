"use client";

interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T) => React.ReactNode;
    align?: "left" | "center" | "right";
    width?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    title?: string;
    maxHeight?: string;
    onRowClick?: (item: T) => void;
}

export default function DataTable<T extends Record<string, unknown>>({
    data,
    columns,
    title,
    maxHeight = "300px",
    onRowClick
}: DataTableProps<T>) {
    const getValue = (item: T, key: string): string | number | undefined => {
        const keys = key.split(".");
        let value: unknown = item;
        for (const k of keys) {
            if (value && typeof value === "object" && k in value) {
                value = (value as Record<string, unknown>)[k];
            } else {
                return undefined;
            }
        }
        if (typeof value === "string" || typeof value === "number") {
            return value;
        }
        return undefined;
    };

    return (
        <div className="w-full">
            {title && (
                <h3 className="text-xs uppercase font-black tracking-widest text-neutral-400 mb-4">
                    {title}
                </h3>
            )}

            <div className="border border-white/5 rounded-sm overflow-hidden">
                {/* Header */}
                <div className="bg-neutral-900/50 border-b border-white/5">
                    <div className="flex">
                        {columns.map((col) => (
                            <div
                                key={String(col.key)}
                                className={`px-4 py-3 text-[9px] uppercase font-black tracking-widest text-neutral-500
                                    ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                                    ${col.width || ""}`}
                            >
                                {col.header}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto" style={{ maxHeight }}>
                    {data.length === 0 ? (
                        <div className="px-4 py-8 text-center text-neutral-500 text-sm">
                            No data available
                        </div>
                    ) : (
                        data.map((item, index) => (
                            <div
                                key={index}
                                className={`flex border-b border-white/5 last:border-0
                                    ${onRowClick ? "cursor-pointer hover:bg-white/[0.02]" : ""}
                                    transition-colors`}
                                onClick={() => onRowClick?.(item)}
                            >
                                {columns.map((col) => (
                                    <div
                                        key={String(col.key)}
                                        className={`px-4 py-3 text-[11px] text-neutral-300
                                            ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                                            ${col.width || ""}`}
                                    >
                                        {col.render
                                            ? col.render(item)
                                            : String(getValue(item, String(col.key)) ?? "")}
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Footer */}
            {data.length > 0 && (
                <div className="mt-2 text-[9px] text-neutral-500">
                    Showing {data.length} {data.length === 1 ? "item" : "items"}
                </div>
            )}
        </div>
    );
}
