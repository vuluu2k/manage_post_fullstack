import { useEffect } from 'react';
import { routes } from 'config';
import { useMeQuery } from 'generated/graphql';
import { useRouter } from 'next/router';

export const useCheckAuth = () => {
  const router = useRouter();

  const { data, loading } = useMeQuery();

  console.log(data?.me && router.route === routes.createPost, router.route);

  useEffect(() => {
    if (!loading) {
      if (
        data?.me &&
        (router.route === routes.login ||
          router.route === routes.register ||
          router.route === routes.forgotPassword ||
          router.route === routes.changePassword)
      )
        router.replace(routes.home);
    } else if (!data?.me && (router.route !== routes.login || router.route !== routes.register)) router.replace(routes.login);
  }, [data, loading, router]);

  return { data, loading };
};
