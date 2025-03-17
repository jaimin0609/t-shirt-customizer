import LoginPageComponent from '../components/Auth/LoginPage';

// This is a forwarding component that re-exports the LoginPage component
const LoginPage = () => {
    return <LoginPageComponent />;
};

export default LoginPage; 