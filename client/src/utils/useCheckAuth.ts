import { useEffect } from 'react';
import { routes } from 'config';
import { useMeQuery } from 'generated/graphql';
import { useRouter } from 'next/router';

export const useCheckAuth = () => {
  const router = useRouter();

  const { data, loading } = useMeQuery();

  useEffect(() => {
    if (
      !loading &&
      data?.me &&
      (router.route === routes.login ||
        router.route === routes.register ||
        router.route === routes.forgotPassword ||
        router.route === routes.changePassword)
    ) {
      router.replace(routes.home);
    }
  }, [data, loading, router]);

  return { data, loading };
};
