import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// Define the expected structure of the memory API exposed by the preload script
interface ExposedMemoryAPI {
  getMemory: () => Promise<any>; // Adjust return type based on actual implementation
  // Add other memory-related methods if needed
}

declare global {
  interface Window {
    memory: ExposedMemoryAPI; // Declare the memory API on the Window object
  }
}

interface MemoryState {
  memoryInfo: any; // Adjust type based on actual memory info structure
  isLoading: boolean;
  error: string | null;
}

export function useMemory() {
  const [memoryState, setMemoryState] = useState<MemoryState>({
    memoryInfo: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchMemory = async () => {
      if (window.memory?.getMemory) {
        try {
          const info = await window.memory.getMemory();
          setMemoryState({ memoryInfo: info, isLoading: false, error: null });
          toast.success('Memory info fetched!');
        } catch (err: any) {
          console.error('Error fetching memory info:', err);
          setMemoryState({ memoryInfo: null, isLoading: false, error: err.message });
          toast.error(`Failed to fetch memory info: ${err.message}`);
        }
      } else {
        setMemoryState({ memoryInfo: null, isLoading: false, error: 'Memory API not exposed in preload script.' });
        toast.error('Memory API not available.');
        console.error('Memory API not exposed in preload script.');
      }
    };

    fetchMemory();

    // Consider adding an interval to fetch memory info periodically
    // const intervalId = setInterval(fetchMemory, 5000); // Fetch every 5 seconds
    // return () => clearInterval(intervalId);

  }, []); // Empty dependency array means this effect runs once on mount

  return memoryState;
} 