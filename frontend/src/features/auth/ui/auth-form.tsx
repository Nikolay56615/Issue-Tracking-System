import { Card, CardContent, CardFooter, CardHeader, CardTitle, } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet, } from '@/components/ui/field.tsx';
import { Input } from '@/components/ui/input.tsx';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useState } from 'react';
import { useAppDispatch } from '@/store';
import { login, register } from '@/features/auth/model/auth.actions.ts';

const authFormSchema = z.object({
  email: z.email(),
  username: z.string(),
  password: z.string(),
});

type Mode = 'login' | 'register';

const modeMapping: Record<
  Mode,
  {
    title: string;
    primaryButtonText: string;
    secondaryButtonText: string;
  }
> = {
  login: {
    title: 'Login',
    primaryButtonText: 'Login',
    secondaryButtonText: 'Create Account',
  },
  register: {
    title: 'Create Account',
    primaryButtonText: 'Register',
    secondaryButtonText: 'Login',
  },
};

export const AuthForm = () => {
  const dispatch = useAppDispatch();

  const [mode, setMode] = useState<Mode>('register');

  const form = useForm<z.infer<typeof authFormSchema>>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof authFormSchema>) => {
    if (mode === 'register') {
      const promise = dispatch(register(data)).unwrap();

      toast.promise(promise, {
        loading: 'Loading...',
        success: (response) => `User with ${response.id} has been created`,
        error: (err) => err || 'Error creating user',
      });
    } else {
      const promise = dispatch(login(data)).unwrap();

      toast.promise(promise, {
        loading: 'Loading...',
        success: (token) => `Logged in with token ${token}`,
        error: (err) => err || 'Login error',
      });
    }
  }

  return (
    <Card className="w-md">
      <CardHeader>
        <CardTitle>{modeMapping[mode].title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="form-auth" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldSet className="gap-4">
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      placeholder="example@example.com"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <Input
                      {...field}
                      id="username"
                      type="text"
                      placeholder="example"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="password"
                      type="password"
                      placeholder="••••••••"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="vertical">
          <Button className="w-full" type="submit" form="form-auth">
            {modeMapping[mode].primaryButtonText}
          </Button>
          <Button
            variant="link"
            onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
          >
            {modeMapping[mode].secondaryButtonText}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
};
