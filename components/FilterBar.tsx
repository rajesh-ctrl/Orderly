"use client";

import Select from "react-select";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function FilterBar({ customers }: { customers: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [customer, setCustomer] = useState(searchParams.get("customer") || "");
  const [dateRange, setDateRange] = useState(
    searchParams.get("dateRange") || ""
  );
  const [fromDate, setFromDate] = useState(searchParams.get("fromDate") || "");
  const [toDate, setToDate] = useState(searchParams.get("toDate") || "");

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "Pending", label: "Pending" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const dateOptions = [
    { value: "", label: "All Dates" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ];

  const customerOptions = customers.map((name) => ({
    value: name,
    label: name,
  }));

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (customer) params.set("customer", customer);
    if (dateRange) params.set("dateRange", dateRange);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    router.push(`/orders?${params.toString()}`);
  };

  const resetFilters = () => {
    setStatus("");
    setCustomer("");
    setDateRange("");
    setFromDate("");
    setToDate("");
    router.push("/orders");
  };

  // ✅ Common React Select styles for compact height
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: "32px",
      height: "32px",
      fontSize: "0.875rem", // text-sm
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: "0 6px",
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      height: "32px",
    }),
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-3">
        {/* Predefined Date Range */}
        <div className="w-36">
          <Select
            options={dateOptions}
            placeholder="Date Range"
            value={dateOptions.find((opt) => opt.value === dateRange)}
            onChange={(selected) => {
              setDateRange(selected?.value || "");
              setFromDate("");
              setToDate("");
            }}
            instanceId="date-filter"
            styles={selectStyles}
          />
        </div>

        <p className="text-gray-600 text-xs lg:text-sm hidden xl:flex">or</p>

        {/* Custom Date Range */}
        <input
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setDateRange("");
          }}
          className="border border-gray-200 rounded px-2 text-sm bg-white h-8"
        />
        <p className="text-gray-600 text-xs lg:text-sm hidden xl:flex">till </p>
        <input
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setDateRange("");
          }}
          className="border border-gray-200 rounded px-2 text-sm bg-white h-8"
        />

        {/* Status Filter */}
        <div className="w-36">
          <Select
            options={statusOptions}
            placeholder="Status"
            value={statusOptions.find((opt) => opt.value === status)}
            onChange={(selected) => setStatus(selected?.value || "")}
            instanceId="status-filter"
            styles={selectStyles}
          />
        </div>

        {/* Customer Filter */}
        <div className="w-44">
          <Select
            options={customerOptions}
            placeholder="Customer"
            //   value={customerOptions.find((opt) => opt.value === customer)}

            value={
              customer
                ? customerOptions.find((opt) => opt.value === customer)
                : null
            } // ✅ Controlled by state
            onChange={(selected) => setCustomer(selected?.value || "")}
            instanceId="customer-filter"
            isClearable
            styles={selectStyles}
          />
        </div>
      </div>
      <div className="gap-2 flex ">
        {/* Apply & Reset Buttons */}
        <button
          onClick={applyFilters}
          className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm h-8"
        >
          Apply
        </button>
        <button
          onClick={resetFilters}
          className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm h-8"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
