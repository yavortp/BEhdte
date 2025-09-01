import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import { read, utils } from 'xlsx';
import { processBulkBookings } from '../services/bookingService';

const FileUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [previewData, setPreviewData] = useState<any[] | null>(null);
    const [uploadResult, setUploadResult] = useState<{
        success: number;
        failed: number;
        total: number;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setIsUploading(true);
            setFile(selectedFile);

            try {
                    const data = await readExcelFile(selectedFile);
                    setPreviewData(data.slice(0, 5)); // Preview only first 5 rows
            } catch (error) {
                    console.error('Excel parsing failed:', error);
                    toast.error('Failed to read file. Please make sure it is a valid Excel file.');
                    setFile(null);

                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
            } finally {
                    setIsUploading(false)
            }
        }
    };

    const readExcelFile = async (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const buffer = e.target?.result as ArrayBuffer;
                if (!buffer) {
                    reject(new Error("File read failed"));
                    return;
                }
                try {
                    const workbook = read(new Uint8Array(buffer), { type: "array" });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = utils.sheet_to_json(worksheet, { range: "A1:R20" });
                    resolve(jsonData);
                } catch (err) {
                    reject(new Error("Excel parsing failed"));
                }
            };
                reader.onerror = (err) => {
                    console.error("FileReader error:", err);
                    reject(new Error("Could not read file"));
                };
            reader.readAsArrayBuffer(file);
        });
    };

    const processAndValidateData = async (excelData: any[]) => {
        // Here we would map the Excel columns to our required fields
        // and validate that all required fields are present
        const requiredFields = ['bookingNumber', 'startTime', 'destination'];

        // Check for required fields in the first row
        const firstRow = excelData[0];
        const missingFields = requiredFields.filter(field => {
            // Check for various common column names that might match our required fields
            const possibleNames = {
                bookingNumber: ['bookingNumber', 'booking number', 'booking_number', 'booking', 'id'],
                startTime: ['startTime', 'start time', 'start_time', 'departure', 'departure time'],
                destination: ['Destination', 'dest', 'to', 'dropoff', 'drop off', 'drop-off'],
                startLocation: ['start location']
            };

            return !Object.keys(firstRow).some(key =>
                // @ts-ignore
                possibleNames[field].some(name =>
                    key.toLowerCase().includes(name.toLowerCase())
                )
            );
        });

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Map Excel data to our booking structure
        return excelData.map(row => {
            // Find the correct column name for each required field
            const getFieldValue = (fieldOptions: string[]) => {
                const key = Object.keys(row).find(k =>
                    fieldOptions.some(opt => k.toLowerCase().includes(opt.toLowerCase()))
                );
                return key ? row[key] : null;
            };

            return {
                bookingNumber: getFieldValue(['bookingNumber', 'booking number', 'booking_number', 'booking', 'id']),
                startTime: getFieldValue(['startTime', 'start time', 'start_time', 'departure', 'departure time']),
                destination: getFieldValue(['destination', 'dest', 'to', 'drop off', 'drop-off']),
                driverId: getFieldValue(['driverId', 'driver id', 'driver_id', 'driver']),
                vehicleId: getFieldValue(['vehicleId', 'vehicle id', 'vehicle_id', 'vehicle']),
                // Additional fields as needed
            };
        });
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            const excelData = await readExcelFile(file);

            if (excelData.length === 0) {
                toast.error('The file contains no data.');
                setIsUploading(false);
                return;
            }
            const processedData = await processAndValidateData(excelData);
            setPreviewData(processedData.slice(0, 5));
            // Send the processed data to the backend
            const result = await processBulkBookings(file);

            setUploadResult({
                success: result.bookingsCreated,
                failed: excelData.length - result.bookingsCreated,
                total: excelData.length
            });

            toast.success(`Successfully processed ${result.bookingsCreated} out of ${excelData.length} bookings.`);

            // Reset the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to process the file.');
        } finally {
            setIsUploading(false);
        }
    };

    const resetUpload = () => {
        setFile(null);
        setPreviewData(null);
        setUploadResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleViewBookings = () => {
        navigate('/');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Upload Bookings</h2>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                    {uploadResult ? (
                        <div className="text-center">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                            <h3 className="mt-2 text-lg font-medium text-gray-900">Upload Complete</h3>
                            <div className="mt-3">
                                <p className="text-sm text-gray-500">
                                    Successfully processed {uploadResult.success} out of {uploadResult.total} bookings.
                                </p>
                                {uploadResult.failed > 0 && (
                                    <p className="mt-1 text-sm text-red-500">
                                        Failed to process {uploadResult.failed} bookings. Please check the data and try again.
                                    </p>
                                )}
                            </div>
                            <div className="mt-5 flex justify-center space-x-3">
                                <button
                                    type="button"
                                    onClick={resetUpload}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Upload Another File
                                </button>
                                <button
                                    type="button"
                                    onClick={handleViewBookings}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    View Bookings
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col items-center">
                                <div
                                    className={`
                    mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md
                    ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'}
                    transition-colors duration-200 w-full max-w-lg
                  `}
                                >
                                    <div className="space-y-1 text-center">
                                        {file ? (
                                            <div>
                                                <FileText className="mx-auto h-12 w-12 text-green-500" />
                                                <p className="mt-1 text-sm text-gray-600">
                                                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                <div className="flex text-sm text-gray-600">
                                                    <label
                                                        htmlFor="file-upload"
                                                        className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                                    >
                                                        <span>Upload a file</span>
                                                        <input
                                                            id="file-upload"
                                                            name="file-upload"
                                                            type="file"
                                                            ref={fileInputRef}
                                                            className="sr-only"
                                                            onChange={handleFileChange}
                                                            accept=".xlsx,.xls"
                                                        />
                                                    </label>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    Excel files only (.xlsx, .xls)
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {previewData && (
                                    <div className="mt-6 w-full max-w-4xl">
                                        <h3 className="text-lg font-medium text-gray-900 mb-3">Preview</h3>
                                        <div className="bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto">
                                            <div className="inline-block min-w-full">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-100">
                                                    <tr>
                                                        {previewData.length > 0 &&
                                                            Object.keys(previewData[0]).map((header, index) => (
                                                                <th
                                                                    key={index}
                                                                    scope="col"
                                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                                >
                                                                    {header}
                                                                </th>
                                                            ))
                                                        }
                                                    </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                    {previewData.map((row, rowIndex) => (
                                                        <tr key={rowIndex}>
                                                            {Object.values(row).map((cell: any, cellIndex) => (
                                                                <td
                                                                    key={cellIndex}
                                                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                                                >
                                                                    {cell?.toString() || '-'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                                <Info className="h-4 w-4 mr-1 text-blue-500" />
                                                Showing preview of first 5 rows
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 flex justify-center">
                                    {file ? (
                                        <div className="flex space-x-3">
                                            <button
                                                type="button"
                                                onClick={resetUpload}
                                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                Change File
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleUpload}
                                                disabled={isUploading}
                                                className={`
                          inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm
                          text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                          ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}
                        `}
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    'Process Bookings'
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <Upload className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                                            Select File
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 border-t border-gray-200 pt-6">
                                <div className="flex items-center">
                                    <Info className="h-5 w-5 text-blue-500" />
                                    <h3 className="ml-2 text-lg font-medium text-gray-900">File Requirements</h3>
                                </div>
                                <div className="mt-3 text-sm text-gray-600">
                                    <p className="mb-2">Please ensure your Excel file includes the following mandatory columns:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Booking number</li>
                                        <li>Driver/Vehicle (optional on upload, can be assigned later)</li>
                                        <li>Start time</li>
                                        <li>Destination</li>
                                    </ul>
                                    <p className="mt-3">
                                        The system will attempt to match your column headers to our required fields.
                                        For best results, use clear column headers.
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileUpload;

