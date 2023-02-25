import * as yup from 'yup';
import Router from 'next/router';
import { Save } from '@mui/icons-material';
import { useState } from 'react';
import { LoadingButton } from '@mui/lab';
import { Formik, Form } from 'formik';
import { useSession } from 'next-auth/react';

import * as UserAPI from '@client/api/UserAPI';
import MinimalLayout from '@client/components/Layouts/MinimalLayout';
import TextField from '@client/components/formikMui/TextField';
import serverCheckSession from 'lib/serverCheckSession';

const UserSchema = yup.object({
  email: yup.string().required('Required'),
  firstName: yup.string().required('Required'),
  lastName: yup.string().required('Required'),
});

export default function NewUser(props) {
  const [loading] = useState(false);
  const { data: user } = useSession();
  const initialValues = {
    email: user.email || '',
    troop: 'NM1412',
    firstName: '',
    lastName: '',
    roles: [],
  };

  async function handleSubmit(values) {
    const { error } = await UserAPI.update(values);

    if (error) {
      return console.error(error);
    }

    Router.push('/?onboard=true');
  }

  return (
    <MinimalLayout title='Looks like you are new here!'>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        enableReinitialize
        validationSchema={UserSchema}
      >
        <Form style={{ marginTop: 8 }}>
          <TextField
            disabled
            label='Email Address'
            name='email'
          />
          <TextField
            disabled
            label='Trail Life Troop'
            name='troop'
          />
          <TextField
            label='First Name'
            name='firstName'
          />
          <TextField
            label='Last Name'
            name='lastName'
          />
          <div style={{ textAlign: 'center' }}>
            <LoadingButton
              startIcon={<Save />}
              loadingPosition='start'
              loading={loading}
              variant='contained'
              type='submit'
              sx={{ textTransform: 'none' }}
            >
              Save
            </LoadingButton>
          </div>
        </Form>
      </Formik>
    </MinimalLayout>
  );
}

export async function getServerSideProps({ req, res }) {
  const props = await serverCheckSession(req, res);
  return props;
}
