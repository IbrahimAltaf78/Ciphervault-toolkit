import { redirect } from 'next/navigation';

export default function HomePage() {
    redirect('/encoding');
    return null;
}