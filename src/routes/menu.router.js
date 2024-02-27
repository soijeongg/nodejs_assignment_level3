import express from 'express';
import Joi from 'joi';
import { prisma } from '../utils/index.js';

const router = express.Router();
// 검증을 위한  Joi schema 정의
const categorySchema = Joi.object({
  categoryId: Joi.number().integer().required(),
});

const menuSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  image: Joi.string().required(),
  price: Joi.number().min(0).required(),
});
// 현재 schema.prisma의 model 상태
//   model Categories {
//     categoryId Int    @id @default(autoincrement()) @map("categoryId")
//     name       String @map("name")
//     order      Int    @map("order")

//     menus      Menus[]

//     @@map("Categories")
//   }

//   enum MenuStatus {
//     FOR_SALE
//     SOLD_OUT
//   }

//   model Menus {
//     menuId      Int         @id @default(autoincrement()) @map("menuId")
//     categoryId  Int         @map("categoryId")
//     name        String      @map("name")
//     description String      @map("description")
//     image       String      @map("image")
//     price       Int         @map("price")
//     status      MenuStatus  @default(FOR_SALE) @map("status")
//     order       Int         @map("order")
//     category    Categories  @relation(fields: [categoryId], references: [categoryId], onDelete: Cascade)

//     @@map("Menus")
//   }

// 1. 메뉴 등록 API
// POST /:categoryId/menus
// 설명
// 메뉴 이름, 설명, 이미지, 가격을 request에서 전달받기
// 새롭게 등록된 메뉴는 가장 마지막 순서로 설정됩니다.
// 메뉴는 두 가지 상태, 판매 중(FOR_SALE)및 매진(SOLD_OUT) 을 가질 수 있습니다.
// 메뉴 등록 시 기본 상태는 판매 중(FOR_SALE) 입니다.
// 가격이 0원 이하일 경우, “메뉴 가격은 0보다 작을 수 없습니다.” 메시지 반환하기
// 요청 예시
//{
//     "name": "김치찌개",
//     "description":"김치찌개는 맛있다.",
//     "image":"https://hanghae99-assets-1.s3.ap-northeast-2.amazonaws.com/Lv/Screenshot-Kimchi",
//     "price": 8000
//   }

// 응답 예시
// {
//     "message": "메뉴를 등록하였습니다."
//   }

// 에러 응답 예시
// # 400 body 또는 params를 입력받지 못한 경우
// { message: '데이터 형식이 올바르지 않습니다.' }
// # 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
// { message: 존재하지 않는 카테고리입니다. }
// # 400 메뉴 가격이 0보다 작은 경우
// { message: 메뉴 가격은 0보다 작을 수 없습니다. }

router.post('/:categoryId/menus', async (req, res, next) => {
  try {
    if (!req.body || !req.params) {
      return res
        .status(400)
        .json({ message: '데이터 형식이 올바르지 않습니다.' });
    }
    const { error: categoryError } = categorySchema.validate(req.params);
    if (categoryError) {
      return res
        .status(400)
        .json({ message: '데이터 형식이 올바르지 않습니다.' });
    }
    const { error: menuError } = menuSchema.validate(req.body);
    if (menuError) {
      const isPriceInvalid = menuError.details.some(
        (detail) =>
          detail.path.includes('price') && detail.type === 'number.min'
      );
      if (isPriceInvalid) {
        return res
          .status(400)
          .json({ message: '메뉴 가격은 0보다 작을 수 없습니다.' });
      }
      return res
        .status(400)
        .json({ message: '요청 데이터 형식이 올바르지 않습니다.' });
    }
    const categoryId = +req.params.categoryId;
    const category = await prisma.categories.findOne({
      where: {
        categoryId,
      },
    });
    if (!category) {
      return res.status(404).json({ message: '존재하지 않는 카테고리입니다.' });
    }
    const lastMenu = await prisma.menus.findFirst({
      where: {
        categoryId,
      },
      orderBy: {
        order: 'desc',
      },
    });
    const order = lastMenu ? lastMenu.order + 1 : 1;
    await prisma.categories.create({
      data: {
        categoryId,
        name: req.body.name,
        description: req.body.description,
        image: req.body.image,
        price: req.body.price,
        order,
      },
    });
    return res.status(201).json({ message: '메뉴를 등록하였습니다.' });
  } catch (error) {
    next(error);
  }
});

// 2. 카테고리별 메뉴 조회 API
// GET /:categoryId/menus

// 3. 메뉴 상세 조회 API
// GET /:categoryId/menus/:menuId

// 4.메뉴 수정 API
// PATCH /:categoryId/menus/:menuId

//5. 메뉴 삭제 API
// DELETE /:categoryId/menus/:menuId

export default router;
