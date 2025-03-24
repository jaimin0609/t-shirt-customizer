import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Box, Button, Text, Flex } from '../../styles/components';
import { HiOutlineShoppingCart } from 'react-icons/hi';

const EmptyCartContainer = styled(Box)`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const EmptyCartBox = styled(Flex)`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: ${({ theme }) => theme.spacing.lg};
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const CartIcon = styled(HiOutlineShoppingCart)`
  width: 64px;
  height: 64px;
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const EmptyCartBase = () => {
    return (
        <EmptyCartContainer>
            <Text as="h1" fontSize="2xl" fontWeight="bold" mb={4}>
                Shopping Cart
            </Text>
            <EmptyCartBox>
                <CartIcon />
                <Text fontSize="xl" fontWeight="semibold" mb={3}>
                    Your cart is empty
                </Text>
                <Text color="gray.600" mb={5}>
                    Looks like you haven't added any items to your cart yet.
                </Text>
                <Button as={Link} to="/products" variant="primary">
                    Start Shopping
                </Button>
            </EmptyCartBox>
        </EmptyCartContainer>
    );
};

export default EmptyCartBase; 