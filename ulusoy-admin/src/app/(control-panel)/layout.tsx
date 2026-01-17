import MainLayout from 'src/components/MainLayout';
import AuthGuardRedirect from '@auth/AuthGuardRedirect';

function Layout({ children }) {
	return (
		<MainLayout>{children}</MainLayout>
	);
}

export default Layout;
