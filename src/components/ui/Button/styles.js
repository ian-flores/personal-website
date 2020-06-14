import styled from 'styled-components';
import tw from 'tailwind.macro';
import { motion } from 'framer-motion';

export const Button = motion.custom(styled.button`
  outline: none !important;
  ${tw`py-2 px-8 rounded-full border border-teal-600 text-white`};

  ${({ primary }) => (primary ? tw`bg-teal-600` : tw`text-teal-600`)};

  ${({ block }) => block && tw`w-full`};
`);
