import { useState, useCallback, useEffect } from "react";
import { QuickDateRange, getDateRangeFromQuickFilter } from "@/components/filters/QuickDateFilter";
import { projects, schemes, locations } from "@/lib/api";

export interface InterviewFilterState {
  searchTerm: string;
  statusFilter: string;
  projectFilter: string;
  districtFilter: string;
  areaFilter: string;
  schemeFilter: string;
  fromDate?: Date;
  toDate?: Date;
  quickDateFilter: QuickDateRange;
  currentPage: number;
}

export function useInterviewFilters() {
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [schemeFilter, setSchemeFilter] = useState("all");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [quickDateFilter, setQuickDateFilter] = useState<QuickDateRange>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Dropdown data
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [schemesList, setSchemesList] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // Load dropdown data
  const loadDropdownData = useCallback(async () => {
    try {
      setLoadingDropdowns(true);
      const [projectsResponse, schemesResponse, districtsResponse, areasResponse] = await Promise.all([
        projects.getAll({ limit: 100 }),
        schemes.getAll({ limit: 100 }),
        locations.getByType('district', { active: true }),
        locations.getByType('area', { active: true })
      ]);

      if (projectsResponse.success) setProjectsList(projectsResponse.data.projects || []);
      if (schemesResponse.success) setSchemesList(schemesResponse.data.schemes || []);
      if (districtsResponse.success) setDistricts(districtsResponse.data.locations || []);
      if (areasResponse.success) setAreas(areasResponse.data.locations || []);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    } finally {
      setLoadingDropdowns(false);
    }
  }, []);

  useEffect(() => {
    loadDropdownData();
  }, [loadDropdownData]);

  // Handle quick date filter change
  const handleQuickDateFilterChange = useCallback((range: QuickDateRange) => {
    setQuickDateFilter(range);
    
    if (range && range !== 'custom') {
      const dateRange = getDateRangeFromQuickFilter(range);
      if (dateRange) {
        setFromDate(dateRange.fromDate);
        setToDate(dateRange.toDate);
      }
    }
    
    setCurrentPage(1);
  }, []);

  // Handle custom date change
  const handleFromDateChange = useCallback((date: Date | undefined) => {
    setFromDate(date);
    if (quickDateFilter !== 'custom') {
      setQuickDateFilter('custom');
    }
    setCurrentPage(1);
  }, [quickDateFilter]);

  const handleToDateChange = useCallback((date: Date | undefined) => {
    setToDate(date);
    if (quickDateFilter !== 'custom') {
      setQuickDateFilter('custom');
    }
    setCurrentPage(1);
  }, [quickDateFilter]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("all");
    setProjectFilter("all");
    setDistrictFilter("all");
    setAreaFilter("all");
    setSchemeFilter("all");
    setFromDate(undefined);
    setToDate(undefined);
    setQuickDateFilter(null);
    setCurrentPage(1);
  }, []);

  // Get API params for filtering
  const getApiParams = useCallback((page?: number, limit: number = 10) => {
    const params: any = {
      page: page || currentPage,
      limit,
    };

    if (searchTerm) params.search = searchTerm;
    if (statusFilter !== "all") params.status = statusFilter;
    if (projectFilter !== "all") params.project = projectFilter;
    if (districtFilter !== "all") params.district = districtFilter;
    if (areaFilter !== "all") params.area = areaFilter;
    if (schemeFilter !== "all") params.scheme = schemeFilter;
    if (fromDate) params.fromDate = fromDate.toISOString();
    if (toDate) params.toDate = toDate.toISOString();
    if (quickDateFilter) params.quickDateFilter = quickDateFilter;

    console.log('🔍 Interview API Params:', params);
    return params;
  }, [
    currentPage,
    searchTerm,
    statusFilter,
    projectFilter,
    districtFilter,
    areaFilter,
    schemeFilter,
    fromDate,
    toDate,
    quickDateFilter
  ]);

  // Get export params
  const getExportParams = useCallback(() => {
    const params: any = {};

    if (searchTerm) params.search = searchTerm;
    if (statusFilter !== "all") params.status = statusFilter;
    if (projectFilter !== "all") params.project = projectFilter;
    if (districtFilter !== "all") params.district = districtFilter;
    if (areaFilter !== "all") params.area = areaFilter;
    if (schemeFilter !== "all") params.scheme = schemeFilter;
    if (fromDate) params.fromDate = fromDate.toISOString();
    if (toDate) params.toDate = toDate.toISOString();
    if (quickDateFilter) params.quickDateFilter = quickDateFilter;

    return params;
  }, [
    searchTerm,
    statusFilter,
    projectFilter,
    districtFilter,
    areaFilter,
    schemeFilter,
    fromDate,
    toDate,
    quickDateFilter
  ]);

  // Dropdown options
  const projectOptions = [
    { value: "all", label: "All Projects" },
    ...projectsList.map(project => ({ value: project._id, label: project.name }))
  ];

  const districtOptions = [
    { value: "all", label: "All Districts" },
    ...districts.map(district => ({ value: district._id, label: district.name }))
  ];

  const areaOptions = [
    { value: "all", label: "All Areas" },
    ...areas.map(area => ({ value: area._id, label: area.name }))
  ];

  const schemeOptions = [
    { value: "all", label: "All Schemes" },
    ...schemesList.map(scheme => ({ value: scheme._id, label: scheme.name }))
  ];

  return {
    filters: {
      searchTerm,
      statusFilter,
      projectFilter,
      districtFilter,
      areaFilter,
      schemeFilter,
      fromDate,
      toDate,
      quickDateFilter,
      currentPage,
    },
    
    setSearchTerm: (value: string) => { setSearchTerm(value); setCurrentPage(1); },
    setStatusFilter: (value: string) => { setStatusFilter(value); setCurrentPage(1); },
    setProjectFilter: (value: string) => { setProjectFilter(value); setCurrentPage(1); },
    setDistrictFilter: (value: string) => { setDistrictFilter(value); setCurrentPage(1); },
    setAreaFilter: (value: string) => { setAreaFilter(value); setCurrentPage(1); },
    setSchemeFilter: (value: string) => { setSchemeFilter(value); setCurrentPage(1); },
    setFromDate: handleFromDateChange,
    setToDate: handleToDateChange,
    setQuickDateFilter: handleQuickDateFilterChange,
    setCurrentPage,
    
    dropdownData: {
      projectsList,
      schemesList,
      districts,
      areas,
    },
    
    dropdownOptions: {
      projectOptions,
      districtOptions,
      areaOptions,
      schemeOptions,
    },
    
    clearAllFilters,
    getApiParams,
    getExportParams,
    loadingDropdowns,
    reloadDropdowns: loadDropdownData,
  };
}
