import express from 'express';
import Joi from 'joi';
import { prisma } from '../utils/index.js';

const router = express.Router();
// 검증을 위한  Joi schema 정의
const categorySchema = Joi.object({
  categoryId: Joi.number().integer().required(),
});
const caregoryandmenuSchema = Joi.object({
  categoryId: Joi.number().integer().required(),
  menuId: Joi.number().integer().required(),
});

const menuSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  image: Joi.string().required(),
  price: Joi.number().min(0).required(),
});
const menuStatusSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  image: Joi.string().required(),
  price: Joi.number().min(0).required(),
  status: Joi.string().valid('FOR_SALE', 'SOLD_OUT').required(),
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
    const { error: bodyError } = menuSchema.validate(req.body);
    if (bodyError) {
      const isPriceInvalid = bodyError.details.some(
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
//- 선택한 카테고리의 메뉴 이름, 이미지, 가격, 순서, 판매 상태 조회하기
// - 조회된 메뉴는 지정된 순서에 따라 정렬됩니다.
// 요청 예시
// {}
// 응답 예시
// {
//     "data": [
//       {
//         "id": 2,
//         "name": "된장찌개",
//         "image": "https://hanghae99-assets-1.s3.ap-northeast-2.amazonaws.com/Lv/Screenshot-Miso",
//         "price": 7500,
//         "order": 1,
//         "status": "SOLD_OUT"
//       },
//       {
//         "id": 1,
//         "name": "김치찌개",
//         "image": "https://hanghae99-assets-1.s3.ap-northeast-2.amazonaws.com/Lv/Screenshot-Kimchi",
//         "price": 8000,
//         "order": 2,
//         "status": "FOR_SALE"
//       }
//     ]
//   }
// 에러 예시
// # 400 body 또는 params를 입력받지 못한 경우
// { message: '데이터 형식이 올바르지 않습니다.' }
// # 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
// { message: 존재하지 않는 카테고리입니다. }

router.get('/:categoryId/menus', async (req, res, next) => {
  try {
    if (!req.params) {
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
    const categoryId = +req.params.categoryId;
    const category = await prisma.categories.findOne({
      where: {
        categoryId,
      },
    });
    if (!category) {
      return res.status(404).json({ message: '존재하지 않는 카테고리입니다.' });
    }
    const menus = await prisma.menus.findMany({
      where: {
        categoryId,
      },
      orderBy: {
        order: 'asc',
      },
      select: {
        menuId: true,
        name: true,
        image: true,
        price: true,
        order: true,
        status: true,
      },
    });
    const revisedMenus = menus.map((menu) => ({
      ...menu,
      id: menu.menuId,
      menuId: undefined,
    }));
    return res.status(200).json({ data: revisedMenus });
  } catch (error) {
    next(error);
  }
});
// 3. 메뉴 상세 조회 API
// GET /:categoryId/menus/:menuId
//선택한 카테고리의 메뉴 이름, 설명, 이미지, 가격, 순서, 판매 상태 조회하기
//요청 예시
// {
//     "data": {
//       "id": 1,
//       "name": "김치찌개",
//       "description": "김치찌개는 맛있다.",
//       "image": "https://hanghae99-assets-1.s3.ap-northeast-2.amazonaws.com/Lv/Screenshot-Kimchi",
//       "price": 8000,
//       "order": 2,
//       "status": "FOR_SALE"
//     }
//   }
// 에러 예시
// # 400 body 또는 params를 입력받지 못한 경우
// { message: '데이터 형식이 올바르지 않습니다.' }
// # 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
// { message: 존재하지 않는 카테고리입니다. }

router.get('/:categoryId/menus/:menuId', async (req, res, next) => {
  try {
    if (!req.params) {
      return res
        .status(400)
        .json({ message: '데이터 형식이 올바르지 않습니다.' });
    }
    const { error: paramsError } = caregoryandmenuSchema.validate(req.params);
    if (paramsError) {
      return res
        .status(400)
        .json({ message: '데이터 형식이 올바르지 않습니다.' });
    }
    const category = await prisma.categories.findOne({
      where: {
        categoryId: +req.params.categoryId,
      },
    });
    if (!category) {
      return res.status(404).json({ message: '존재하지 않는 카테고리입니다.' });
    }
    const { error: bodyError } = menuSchema.validate(req.body);
    const menu = await prisma.menus.findOne({
      where: {
        menuId: +req.params.menuId,
      },
      select: {
        menuId: true,
        name: true,
        description: true,
        image: true,
        price: true,
        order: true,
        status: true,
      },
    });
    if (!menu) {
      return res.status(404).json({ message: '존재하지 않는 메뉴입니다.' });
    }
    const revisedMenu = {
      ...menu,
      id: menu.menuId,
      menuId: undefined,
    };
    return res.status(200).json({ data: revisedMenu });
  } catch (error) {
    next(error);
  }
});

// 4.메뉴 수정 API
// PATCH /:categoryId/menus/:menuId
// - 메뉴 이름, 설명, 이미지, 가격, 순서, 판매 상태를 **request**에서 전달받기
// - 가격이 0원 이하일 경우, “메뉴 가격은 0보다 작을 수 없습니다.” 메시지 반환하기
// - 선택한 메뉴가 존재하지 않을 경우, “존재하지 않는 메뉴입니다." 메시지 반환하기
// - 요청 예시
// {
//     "name": "된장찌개",
//     "description":"된장찌개는 맛있었을것이다?",
//     "price": 7500,
//     "order":1,
//     "status":"SOLD_OUT"
//   }
// 응답 예시
//{
//     "message": "메뉴를 수정하였습니다."
// }
// 에러 응답 예시
// # 400 body 또는 params를 입력받지 못한 경우
// { message: '데이터 형식이 올바르지 않습니다.' }
// # 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
// { message: 존재하지 않는 카테고리입니다. }
// # 404 menuId에 해당하는 메뉴가 존재하지 않을 경우
// { message: 존재하지 않는 메뉴입니다. }
// # 400 메뉴 가격이 0보다 작은 경우
// { message: 메뉴 가격은 0보다 작을 수 없습니다. }

router.patch('/:categoryId/menus/:menuId', async (req, res, next) => {
  try {
    if (!req.params || !req.body) {
      return res
        .status(400)
        .json({ message: '데이터 형식이 올바르지 않습니다.' });
    }
    const { error: paramsError } = caregoryandmenuSchema.validate(req.params);
    if (paramsError) {
      return res
        .status(400)
        .json({ message: '데이터 형식이 올바르지 않습니다.' });
    }
    const { error: bodyError } = menuSchema.validate(req.body);
    if (bodyError) {
      const isPriceInvalid = bodyError.details.some(
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
    const category = await prisma.categories.findOne({
      where: {
        categoryId: +req.params.categoryId,
      },
    });
    if (!category) {
      return res.status(404).json({ message: '존재하지 않는 카테고리입니다.' });
    }
    const menu = await prisma.menus.findOne({
      where: {
        menuId: +req.params.menuId,
      },
    });
    if (!menu) {
      return res.status(404).json({ message: '존재하지 않는 메뉴입니다.' });
    }
    await prisma.menus.update({
      where: {
        menuId: +req.params.menuId,
      },
      data: {
        name: req.body.name,
        description: req.body.description,
        image: req.body.image,
        price: req.body.price,
        order: req.body.order,
        status: req.body.status,
      },
    });
    return res.status(200).json({ message: '메뉴를 수정하였습니다.' });
  } catch (error) {
    next(error);
  }
});

//5. 메뉴 삭제 API
// DELETE /:categoryId/menus/:menuId
// - 선택한 메뉴 삭제하기
// - 선택한 메뉴가 존재하지 않을 경우, “존재하지 않는 메뉴입니다." 메시지 반환하기
// 요청 예시
// {}
// 응답 예시
// {
//   "message": "메뉴를 삭제하였습니다."
// }
// 에러 응답 예시
// # 400 body 또는 params를 입력받지 못한 경우
// { message: '데이터 형식이 올바르지 않습니다.' }
// # 404 categoryId에 해당하는 카테고리가 존재하지 않을 경우
// { message: 존재하지 않는 카테고리입니다. }
// # 404 menuId에 해당하는 메뉴가 존재하지 않을 경우
// { message: 존재하지 않는 메뉴입니다. }

router.delete('/:categoryId/menus/:menuId', async (req, res, next) => {
  try {
    if (!req.params) {
      return res
        .status(400)
        .json({ message: '데이터 형식이 올바르지 않습니다.' });
    }
    const { error: paramsError } = caregoryandmenuSchema.validate(req.params);
    if (paramsError) {
      return res
        .status(400)
        .json({ message: '데이터 형식이 올바르지 않습니다.' });
    }
    const category = await prisma.categories.findOne({
      where: {
        categoryId: +req.params.categoryId,
      },
    });
    if (!category) {
      return res.status(404).json({ message: '존재하지 않는 카테고리입니다.' });
    }
    const menu = await prisma.menus.findOne({
      where: {
        menuId: +req.params.menuId,
      },
    });
    if (!menu) {
      return res.status(404).json({ message: '존재하지 않는 메뉴입니다.' });
    }
    await prisma.menus.delete({
      where: {
        menuId: +req.params.menuId,
      },
    });
    return res.status(200).json({ message: '메뉴를 삭제하였습니다.' });
  } catch (error) {
    next(error);
  }
});
export default router;
