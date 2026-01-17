import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { z } from 'zod';
import _ from 'lodash';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@fuse/core/Link';
import Button from '@mui/material/Button';
import { Alert } from '@mui/material';
import api from '../api';
import { useRouter } from 'next/navigation';

/**
 * Form Validation Schema
 */
const schema = z.object({
	email: z.string().email('Geçerli bir e-posta giriniz').nonempty('E-posta zorunludur'),
	password: z
		.string()
		.min(4, 'Şifre çok kısa.')
		.nonempty('Lütfen şifrenizi giriniz.'),
	remember: z.boolean().optional()
});

type FormType = z.infer<typeof schema>;

const defaultValues = {
	email: '',
	password: '',
	remember: true
};

function AuthJsCredentialsSignInForm() {
	const router = useRouter();
	const { control, formState, handleSubmit, setValue, setError } = useForm<FormType>({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema)
	});

	const { isValid, dirtyFields, errors } = formState;

    // Remove default values effect or set to our admin credentials for testing
	useEffect(() => {
		setValue('email', 'admin@ulusoy.com', {
			shouldDirty: true,
			shouldValidate: true
		});
		setValue('password', 'admin123', {
			shouldDirty: true,
			shouldValidate: true
		});
	}, [setValue]);

	async function onSubmit(formData: FormType) {
		const { email, password } = formData;

		try {
			const response = await api.post('/auth/login', {
				email,
				password
			});

			const { token, user } = response.data;

			if (token) {
				localStorage.setItem('jwt_token', token);
				// You might want to store user info in a context or redux here
				// For now, simple redirect
				window.location.href = '/panel'; // Redirect to dashboard
			}
		} catch (error: any) {
			console.error('Login error:', error);
			setError('root', { 
				type: 'manual', 
				message: error.response?.data?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.' 
			});
		}
	}

	return (
		<form
			name="loginForm"
			noValidate
			className="flex w-full flex-col justify-center"
			onSubmit={handleSubmit(onSubmit)}
		>
			{errors?.root?.message && (
				<Alert
					className="mb-8"
					severity="error"
					sx={(theme) => ({
						backgroundColor: theme.palette.error.light,
						color: theme.palette.error.dark
					})}
				>
					{errors?.root?.message}
				</Alert>
			)}
			<Controller
				name="email"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Email"
						autoFocus
						type="email"
						error={!!errors.email}
						helperText={errors?.email?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>
			<Controller
				name="password"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Password"
						type="password"
						error={!!errors.password}
						helperText={errors?.password?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>
			<div className="flex flex-col items-center justify-center sm:flex-row sm:justify-between">
				<Controller
					name="remember"
					control={control}
					render={({ field }) => (
						<FormControl>
							<FormControlLabel
								label="Beni hatırla"
								control={
									<Checkbox
										size="small"
										{...field}
									/>
								}
							/>
						</FormControl>
					)}
				/>

				<Link
					className="text-md font-medium"
					to="/#"
				>
					Şifremi unuttum?
				</Link>
			</div>
			<Button
				variant="contained"
				color="secondary"
				className="mt-4 w-full"
				aria-label="Sign in"
				disabled={_.isEmpty(dirtyFields) || !isValid}
				type="submit"
				size="large"
			>
				Giriş Yap
			</Button>
		</form>
	);
}

export default AuthJsCredentialsSignInForm;
