"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DatabaseInstance, listDatabases } from '@/lib/api';
import Terminal from '@/components/Terminal';
import Link from 'next/link';

export default function ContainerPage() {
    const params = useParams();
    const id = params.id as string;
    const [instance, setInstance] = useState<DatabaseInstance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchInstance() {
            try {
                const instances = await listDatabases();
                const found = instances.find(i => i.id === id);
                if (found) {
                    setInstance(found);
                } else {
                    setError('Database instance not found');
                }
            } catch (err) {
                setError('Failed to fetch database instance');
            } finally {
                setLoading(false);
            }
        }
        fetchInstance();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen p-8">
                <div className="max-w-7xl mx-auto">
                    Loading...
                </div>
            </div>
        );
    }

    if (error || !instance) {
        return (
            <div className="min-h-screen p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                        {error || 'Database instance not found'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                {/* back button */}
                <div className="mb-8">
                    <Link href="/" className="text-blue-500 hover:text-blue-700">
                        ← Back to Dashboard
                    </Link>
                </div>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">{instance.name}</h1>
                    <p className="text-gray-500">Port: {instance.port}</p>
                </div>

                <div className="space-y-8">
                    <div className="bg-gray-900 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-white">Terminal</h2>
                        <Terminal containerId={instance.id} />
                    </div>

                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4">Connection Details</h2>
                        <div className="space-y-2">
                            <div>
                                <span className="font-medium">Host:</span> localhost
                            </div>
                            <div>
                                <span className="font-medium">Port:</span> {instance.port}
                            </div>
                            <div>
                                <span className="font-medium">Database:</span> postgres
                            </div>
                            <div>
                                <span className="font-medium">Username:</span> postgres
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 