'use client';

export default function EmployeePortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Employee portal doesn't need the admin sidebar, render children directly
    return <>{children}</>;
}
